/**
 * api/proposal.ts (Vercel Serverless Function)
 * Groq-only-in-Vercel: 2-pass strategy + 3-model fallback
 *
 * Pass 1 (full report): Scout -> Qwen -> 8B
 * Pass 2 (polish exec+solution only): Qwen -> Scout -> 8B
 */

type GroqError = {
  error?: { message?: string; type?: string; code?: string };
};

type Ingest = {
  agencyName?: string;
  niche?: string;
  contactEmail?: string;
  bottleneck?: string;
};

type Metrics = {
  monthlyLeakage?: number;
  annualLeakage?: number;
};

type RequestPayload = {
  payload?: {
    requestId?: string;
    ingest?: Ingest;
    calculatedMetrics?: Metrics;
  };
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const MODELS = {
  pass1Primary: "meta-llama/llama-4-scout-17b-16e-instruct",
  pass1Fallback1: "qwen/qwen3-32b",
  pass1Fallback2: "llama-3.1-8b-instant",
  pass2Primary: "qwen/qwen3-32b",
  pass2Fallback1: "meta-llama/llama-4-scout-17b-16e-instruct",
  pass2Fallback2: "llama-3.1-8b-instant",
} as const;

function safeJsonParse<T>(v: any): T | null {
  try {
    if (typeof v === "string") return JSON.parse(v) as T;
    if (typeof v === "object" && v) return v as T;
    return null;
  } catch {
    return null;
  }
}

function money(n: number | undefined) {
  const x = Number(n || 0);
  return x > 0 ? `$${x.toLocaleString()}` : "N/A";
}

function extractRetryAfterSeconds(msg: string | undefined): number | null {
  if (!msg) return null;
  const m = msg.match(/try again in\s+(\d+)m([\d.]+)s/i);
  if (!m) return null;
  const mins = Number(m[1] || 0);
  const secs = Number(m[2] || 0);
  if (!Number.isFinite(mins) || !Number.isFinite(secs)) return null;
  return Math.max(0, Math.round(mins * 60 + secs));
}

function shouldRetry(status: number, err: GroqError | null) {
  const code = err?.error?.code || "";
  if (status === 429) return true;
  if (status === 500 || status === 502 || status === 503 || status === 504) return true;
  if (code === "rate_limit_exceeded") return true;
  return false;
}

async function callGroq(opts: {
  model: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      err: { error: { message: "Missing GROQ_API_KEY on server", code: "server_misconfig" } },
      content: "",
      raw: null as any,
    };
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs);

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature,
        max_tokens: opts.maxTokens,
      }),
      signal: controller.signal,
    });

    const raw = await res.json().catch(() => null);
    const content =
      raw?.choices?.[0]?.message?.content ??
      raw?.choices?.[0]?.text ??
      "";

    return {
      ok: res.ok,
      status: res.status,
      err: (raw && raw.error) ? (raw as GroqError) : null,
      content: String(content || "").trim(),
      raw,
    };
  } catch (e: any) {
    return {
      ok: false,
      status: 504,
      err: { error: { message: e?.message || "Timeout/Network error", code: "fetch_failed" } },
      content: "",
      raw: null as any,
    };
  } finally {
    clearTimeout(t);
  }
}

async function callWithFallback(args: {
  models: string[];
  messages: Array<{ role: "system" | "user"; content: string }>;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}) {
  const tried: Array<{ model: string; status: number; code?: string }> = [];

  for (const model of args.models) {
    const r = await callGroq({
      model,
      messages: args.messages,
      maxTokens: args.maxTokens,
      temperature: args.temperature,
      timeoutMs: args.timeoutMs,
    });

    tried.push({ model, status: r.status, code: r.err?.error?.code });

    if (r.ok && r.content.length >= 200) {
      return { ok: true, model, content: r.content, tried, raw: r.raw };
    }

    const retry = shouldRetry(r.status, r.err);
    if (!retry) {
      return { ok: false, model, content: r.content, tried, raw: r.raw, err: r.err };
    }
  }

  return { ok: false, model: args.models[args.models.length - 1], content: "", tried, raw: null, err: null };
}

function splitSections(md: string) {
  const exec = md.match(/##\s*Executive Summary\s*\n[\s\S]*?(?=\n##\s|$)/i)?.[0] ?? "";
  const sol = md.match(/##\s*SOLUTION\s+ARCHITECTURE[^\n]*\n[\s\S]*?(?=\n##\s|$)/i)?.[0] ?? "";
  return { exec, sol };
}

function mergeSections(base: string, polished: string) {
  let out = base;

  const newExec = polished.match(/##\s*Executive Summary\s*\n[\s\S]*?(?=\n##\s|$)/i)?.[0];
  const newSol = polished.match(/##\s*SOLUTION\s+ARCHITECTURE[^\n]*\n[\s\S]*?(?=\n##\s|$)/i)?.[0];

  if (newExec) out = out.replace(/##\s*Executive Summary\s*\n[\s\S]*?(?=\n##\s|$)/i, newExec.trim());
  if (newSol)  out = out.replace(/##\s*SOLUTION\s+ARCHITECTURE[^\n]*\n[\s\S]*?(?=\n##\s|$)/i, newSol.trim());

  return out.trim();
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "METHOD_NOT_ALLOWED" });
    return;
  }

  const parsed = safeJsonParse<RequestPayload>(req.body) || (req.body as RequestPayload) || {};
  const payload = parsed.payload || {};
  const requestId = payload.requestId || `fs_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const ingest = payload.ingest || {};
  const metrics = payload.calculatedMetrics || {};

  const agency = ingest.agencyName || "Lead";
  const niche = ingest.niche || "Unknown";
  const bottleneck = ingest.bottleneck || "Not provided";
  const monthly = Number(metrics.monthlyLeakage || 0) || 0;
  const annual = Number(metrics.annualLeakage || 0) || 0;

  const pass1Prompt = `
Generate a concise Markdown diagnostic report.

Hard rules:
- Keep under ~900–1200 tokens.
- No filler. Bullets > paragraphs.
- MUST include these exact lines somewhere:
  Monthly Leakage: ${money(monthly)}
  Annual Leakage: ${money(annual)}
  Current Bottleneck: ${bottleneck}

Use these headings (exact):
## Executive Summary
## Diagnosis
## Revenue at Risk
## SOLUTION ARCHITECTURE: “FlowStackOS 3-Module System”
## Next Steps

Context:
Company: ${agency}
Niche: ${niche}
`.trim();

  const pass1 = await callWithFallback({
    models: [MODELS.pass1Primary, MODELS.pass1Fallback1, MODELS.pass1Fallback2],
    messages: [
      { role: "system", content: "You are a precise revenue-ops analyst." },
      { role: "user", content: pass1Prompt },
    ],
    maxTokens: 1200,
    temperature: 0.2,
    timeoutMs: 25_000,
  });

  if (!pass1.ok) {
    const msg = (pass1 as any)?.err?.error?.message || pass1.raw?.error?.message || "Upstream failure";
    const retryAfterSeconds = extractRetryAfterSeconds(msg);

    res.status(200).json({
      success: false,
      error: "PROPOSAL_GENERATION_FAILED",
      message: msg,
      retryAfterSeconds,
      debug: { requestId, tried: pass1.tried },
      payload: {
        proposalMarkdown:
          "## Executive Summary\n- Proposal generation failed temporarily.\n\n## Next Steps\n- Retry in a few minutes.\n",
        ingest: { ...ingest, bottleneck },
        calculatedMetrics: { ...metrics, monthlyLeakage: monthly, annualLeakage: annual },
      },
    });
    return;
  }

  const pass1Markdown = pass1.content;

  const { exec, sol } = splitSections(pass1Markdown);

  const pass2Prompt = `
Rewrite ONLY the two sections below for clarity and persuasion.
Rules:
- Do NOT change any numeric values or money amounts.
- Keep headings exactly as-is.
- Keep it concise.

Sections:
${exec}

${sol}
`.trim();

  const pass2 = await callWithFallback({
    models: [MODELS.pass2Primary, MODELS.pass2Fallback1, MODELS.pass2Fallback2],
    messages: [
      { role: "system", content: "You rewrite sections while preserving facts." },
      { role: "user", content: pass2Prompt },
    ],
    maxTokens: 700,
    temperature: 0.25,
    timeoutMs: 20_000,
  });

  const finalMarkdown =
    pass2.ok && pass2.content.length > 100
      ? mergeSections(pass1Markdown, pass2.content)
      : pass1Markdown;

  res.status(200).json({
    success: true,
    payload: {
      proposalMarkdown: finalMarkdown,
      ingest: { ...ingest, bottleneck },
      calculatedMetrics: { ...metrics, monthlyLeakage: monthly, annualLeakage: annual },
    },
    debug: {
      requestId,
      modelsUsed: { pass1: pass1.model, pass2: pass2.ok ? pass2.model : null },
      tried: { pass1: pass1.tried, pass2: pass2.tried },
    },
  });
}
