import type { VercelRequest, VercelResponse } from "@vercel/node";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "6mb",
    },
  },
};

type DiscoverySection = "journey" | "pain" | "tools";

type UploadedDiscoveryFile = {
  name?: string;
  type?: string;
  section?: string;
  content_base64?: string;
};

function resolveDiscoveryTokenRegistry(): Record<string, string> {
  try {
    const singleToken = process.env.PORTAL_ACCESS_TOKEN || process.env.DISCOVERY_ACCESS_TOKEN;
    if (singleToken) {
      const tenantId = process.env.PORTAL_TENANT_ID || process.env.DISCOVERY_TENANT_ID || "shared";
      return { [singleToken]: tenantId };
    }

    const raw = process.env.PORTAL_TOKENS || process.env.DISCOVERY_TOKENS;
    if (raw) return JSON.parse(raw);
  } catch {}

  return { "demo-client": "demo" };
}

function resolveAuthorizedTenant(req: VercelRequest): string | null {
  const authHeader = req.headers["authorization"] as string | undefined;
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : ((req.headers["x-discovery-token"] as string | undefined) ||
        (req.headers["x-portal-token"] as string | undefined));
  const queryToken =
    (req.query["token"] as string | undefined) || (req.query["key"] as string | undefined);
  const provided = String(headerToken || queryToken || "").trim();

  const operatorKey = process.env.OPERATOR_KEY;
  if (operatorKey && provided && provided === operatorKey) {
    return "operator";
  }

  const clean = provided.replace(/[^A-Za-z0-9_\-]/g, "").slice(0, 128);
  if (clean.length < 3) return null;

  const registry = resolveDiscoveryTokenRegistry();
  return registry[clean] || null;
}

const TEMPLATES: Record<string, { name: string; description: string; triggers: string[]; solves: string[] }> = {
  lead_intake_crm: {
    name: "Lead Intake + CRM Sync",
    description: "Capture inbound lead, normalize fields, upsert to Airtable, notify owner, schedule follow-up.",
    triggers: ["webhook", "fb_messenger", "website_form", "whatsapp"],
    solves: ["missed inquiries", "no crm", "manual copy", "slow reply", "no record"],
  },
  missed_call_recovery: {
    name: "Missed Call Recovery",
    description: "When a call is missed, send an instant SMS/Messenger reply and log a callback task.",
    triggers: ["missed_call_webhook"],
    solves: ["missed calls", "no callback", "lost phone leads"],
  },
  booking_reminder: {
    name: "Booking Reminder",
    description: "Send automated reminders 24h and 1h before a booking. Update attendance state.",
    triggers: ["booking_created", "schedule_event"],
    solves: ["no-shows", "no confirmation sent", "manual reminder", "forgot to follow up"],
  },
  reengagement_followup: {
    name: "Re-engagement Follow-up",
    description: "Recover stale leads with timed follow-up sequences and CRM activity logging.",
    triggers: ["stale_lead", "no_reply_timeout"],
    solves: ["no follow up", "leads go cold", "staff forgets", "manual chasing"],
  },
  daily_reporting: {
    name: "Daily Reporting",
    description: "Aggregate daily metrics and send an ops digest to the operator each morning.",
    triggers: ["schedule_daily"],
    solves: ["no visibility", "no reporting", "no idea how many leads", "no metrics"],
  },
};

const CHANNEL_MAP: Record<string, string[]> = {
  facebook: ["lead_intake_crm"],
  messenger: ["lead_intake_crm"],
  fb: ["lead_intake_crm"],
  website: ["lead_intake_crm"],
  form: ["lead_intake_crm"],
  whatsapp: ["lead_intake_crm"],
  sms: ["lead_intake_crm"],
  calls: ["lead_intake_crm", "missed_call_recovery"],
  phone: ["lead_intake_crm", "missed_call_recovery"],
  "walk-in": ["lead_intake_crm"],
  referral: ["lead_intake_crm"],
  instagram: ["lead_intake_crm"],
};

const PAIN_MAP = [
  { kw: ["miss", "missed", "no reply", "slow reply", "late"], tpl: ["lead_intake_crm"] },
  { kw: ["follow", "followup", "forgot", "cold", "stale"], tpl: ["reengagement_followup"] },
  { kw: ["no-show", "noshow", "reminder", "forgot booking"], tpl: ["booking_reminder"] },
  { kw: ["no record", "spreadsheet", "notebook", "manual copy", "lost"], tpl: ["lead_intake_crm"] },
  { kw: ["missed call", "call goes", "no callback"], tpl: ["missed_call_recovery"] },
  { kw: ["no report", "no visibility", "no idea", "no metrics"], tpl: ["daily_reporting"] },
  { kw: ["no crm", "weak crm", "no system", "inbox", "manual"], tpl: ["lead_intake_crm"] },
];

const TOOL_MAP = [
  { kw: ["facebook", "messenger", "fb page"], tpl: ["lead_intake_crm"] },
  { kw: ["whatsapp", "whatsapp business"], tpl: ["lead_intake_crm"] },
  { kw: ["google sheets", "spreadsheet"], tpl: ["lead_intake_crm", "daily_reporting"] },
  { kw: ["no crm", "no booking", "notebook"], tpl: ["lead_intake_crm"] },
  { kw: ["booking", "cal.com", "calendly"], tpl: ["booking_reminder"] },
  { kw: ["phone", "calls"], tpl: ["lead_intake_crm", "missed_call_recovery"] },
];

const STEP_PATTERNS = [
  { re: /arrives?\s*(via|through|on|from)?/i, tpl: "lead_intake_crm", node: "Trigger (Webhook / Channel)" },
  { re: /dm|message|messenger|whatsapp|instagram/i, tpl: "lead_intake_crm", node: "Trigger (Messenger Webhook)" },
  { re: /form|website|fills?\s*in/i, tpl: "lead_intake_crm", node: "Trigger (Form Webhook)" },
  { re: /manual\s*reply|replies?\s*manually/i, tpl: "lead_intake_crm", node: "-> Auto-reply Node" },
  { re: /spreadsheet|notebook|writes?\s*down/i, tpl: "lead_intake_crm", node: "-> Airtable Upsert Node" },
  { re: /follow.?up|chases?|reminder/i, tpl: "reengagement_followup", node: "-> Sequence Trigger" },
  { re: /booking|appointment|schedules?/i, tpl: "booking_reminder", node: "Booking Created Trigger" },
  { re: /no.?show|confirmation/i, tpl: "booking_reminder", node: "Reminder Sequence Node" },
  { re: /missed?\s*call|no\s*answer/i, tpl: "missed_call_recovery", node: "Missed Call Webhook" },
  { re: /payment|gcash|paymongo/i, tpl: "lead_intake_crm", node: "-> Payment step (manual)" },
  { re: /report|summary|digest/i, tpl: "daily_reporting", node: "Daily Schedule Trigger" },
  { re: /ignored|no\s*reply|loses?\s*(the)?\s*lead/i, tpl: "reengagement_followup", node: "-> Stale Lead Trigger" },
];

function norm(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function matchKw(text: string, kws: string[]) {
  return kws.some((k) => text.includes(norm(k)));
}

function inferTemplates(journey: string, pain: string, tools: string): string[] {
  const needed = new Set<string>(["lead_intake_crm"]);
  const all = norm(journey + " " + pain + " " + tools);
  const pn = norm(pain);
  const tn = norm(tools);

  for (const [channel, templates] of Object.entries(CHANNEL_MAP)) {
    if (all.includes(channel)) templates.forEach((templateId) => needed.add(templateId));
  }

  for (const { kw, tpl } of PAIN_MAP) {
    if (matchKw(pn + " " + all, kw)) tpl.forEach((templateId) => needed.add(templateId));
  }

  for (const { kw, tpl } of TOOL_MAP) {
    if (matchKw(tn, kw)) tpl.forEach((templateId) => needed.add(templateId));
  }

  needed.add("daily_reporting");
  return [...needed];
}

function parseSteps(text: string) {
  return text
    .split("\n")
    .map((line) => line.replace(/^\uFEFF/, "").trim())
    .filter((line) => line.length > 0)
    .map((line, i) => ({
      index: i + 1,
      raw: line.replace(/^[\d]+[.)]\s*/, "").replace(/^[-*•]\s*/, ""),
    }));
}

function mapStep(raw: string) {
  for (const { re, tpl, node } of STEP_PATTERNS) {
    if (re.test(raw)) return { tpl, node };
  }
  return { tpl: "lead_intake_crm", node: "Set / Code Node (normalize)" };
}

function buildCredentials(templateIds: string[], toolsText: string): string {
  const tn = norm(toolsText);
  const lines: string[] = [
    "- `FLOWSTACK_AIRTABLE_PAT` - Airtable Personal Access Token",
    "- `FLOWSTACK_AIRTABLE_BASE_ID` - Client's Airtable base ID",
  ];

  if (templateIds.includes("lead_intake_crm")) {
    if (tn.includes("facebook") || tn.includes("messenger")) {
      lines.push("- `FB_PAGE_ACCESS_TOKEN_{TENANT}` - Facebook Page Access Token");
      lines.push("- `FB_VERIFY_TOKEN` - Messenger webhook verify token");
    }
    if (tn.includes("whatsapp")) {
      lines.push("- `WHATSAPP_API_TOKEN_{TENANT}` - WhatsApp Business API token");
    }
  }

  lines.push("- `RESEND_API_KEY` - Resend API key for operator notifications");
  return lines.join("\n");
}

function buildManualSteps(templateIds: string[], toolsText: string): string {
  const tn = norm(toolsText);
  const steps: string[] = [];

  if (tn.includes("facebook") || tn.includes("messenger")) {
    steps.push("- **Facebook Page access:** Client must grant you Admin role on their Facebook Page");
    steps.push("- **Meta App webhook:** Register your Railway n8n URL in Meta developer console");
  }
  if (tn.includes("whatsapp")) {
    steps.push("- **WhatsApp Business API:** Client needs a verified WhatsApp Business account");
  }
  steps.push("- **Airtable base ID:** Confirm the `appXXX` base ID from their Airtable URL");
  if (templateIds.includes("booking_reminder")) {
    steps.push("- **Booking source:** Confirm where bookings are created (Calendly, Google Calendar, manual)");
  }

  return steps.join("\n");
}

function inferSectionFromFileName(fileName: string): DiscoverySection {
  const normalized = fileName.toLowerCase();
  if (/pain|problem|issue|bottleneck/.test(normalized)) return "pain";
  if (/tool|stack|system|crm|inventory/.test(normalized)) return "tools";
  return "journey";
}

function normalizeDiscoverySection(value: unknown, fileName: string): DiscoverySection {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "pain" || normalized === "tools" || normalized === "journey") {
    return normalized;
  }
  return inferSectionFromFileName(fileName);
}

function looksLikeJson(mimeType: string, fileName: string): boolean {
  return /json/i.test(mimeType) || /\.json$/i.test(fileName);
}

function looksLikeDocx(mimeType: string, fileName: string): boolean {
  return /wordprocessingml|officedocument/i.test(mimeType) || /\.docx$/i.test(fileName);
}

function looksLikePdf(mimeType: string, fileName: string): boolean {
  return /pdf/i.test(mimeType) || /\.pdf$/i.test(fileName);
}

function decodeBase64ToBuffer(contentBase64: string): Buffer {
  const normalized = contentBase64.includes(",") ? contentBase64.split(",").pop() || "" : contentBase64;
  return Buffer.from(normalized, "base64");
}

async function extractTextFromUploadedFile(file: UploadedDiscoveryFile): Promise<string> {
  const fileName = String(file.name || "upload").slice(0, 120);
  const mimeType = String(file.type || "");
  const contentBase64 = String(file.content_base64 || "");
  if (!contentBase64) return "";

  const buffer = decodeBase64ToBuffer(contentBase64);
  if (looksLikePdf(mimeType, fileName)) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return String(result.text || "").trim();
    } finally {
      if (typeof (parser as any).destroy === "function") {
        await (parser as any).destroy();
      }
    }
  }

  if (looksLikeDocx(mimeType, fileName)) {
    const result = await mammoth.extractRawText({ buffer });
    return String(result.value || "").trim();
  }

  if (looksLikeJson(mimeType, fileName)) {
    try {
      return JSON.stringify(JSON.parse(buffer.toString("utf8")), null, 2);
    } catch {
      return buffer.toString("utf8").trim();
    }
  }

  return buffer.toString("utf8").trim();
}

async function resolveDiscoveryInputs(body: Record<string, unknown>) {
  const sections: Record<DiscoverySection, string[]> = {
    journey: [String(body.journey_map || "").trim()],
    pain: [String(body.pain_points || "").trim()],
    tools: [String(body.tools_inventory || "").trim()],
  };
  const extractionSummary: Array<{ name: string; section: DiscoverySection; extracted_chars: number }> = [];
  const extractionErrors: Array<{ name: string; message: string }> = [];
  const uploadedFiles = Array.isArray(body.uploaded_files) ? (body.uploaded_files as UploadedDiscoveryFile[]) : [];

  for (const uploadedFile of uploadedFiles) {
    const name = String(uploadedFile?.name || "upload").slice(0, 120);
    const section = normalizeDiscoverySection(uploadedFile?.section, name);
    try {
      const extractedText = await extractTextFromUploadedFile(uploadedFile);
      if (extractedText) {
        sections[section].push(`Source file: ${name}\n${extractedText}`);
        extractionSummary.push({ name, section, extracted_chars: extractedText.length });
      } else {
        extractionErrors.push({ name, message: "No text could be extracted from the file." });
      }
    } catch (error) {
      extractionErrors.push({
        name,
        message: error instanceof Error ? error.message : "File extraction failed.",
      });
    }
  }

  return {
    journey: sections.journey.filter(Boolean).join("\n\n").trim(),
    pain: sections.pain.filter(Boolean).join("\n\n").trim(),
    tools: sections.tools.filter(Boolean).join("\n\n").trim(),
    extractionSummary,
    extractionErrors,
  };
}

function buildConceptDoc(opts: {
  tenantId: string;
  journey: string;
  pain: string;
  tools: string;
  generatedAt: string;
}): string {
  const { tenantId, journey, pain, tools, generatedAt } = opts;
  const steps = parseSteps(journey);
  const templateIds = inferTemplates(journey, pain, tools);
  const stepRows = steps
    .map((step) => {
      const mapped = mapStep(step.raw);
      return `| ${step.index} | ${step.raw} | \`${mapped.tpl}\` | ${mapped.node} |`;
    })
    .join("\n");

  const deployOrder = [
    "lead_intake_crm",
    "missed_call_recovery",
    "booking_reminder",
    "reengagement_followup",
    "daily_reporting",
  ].filter((id) => templateIds.includes(id));

  const templateList = templateIds
    .map((id) => ({ id, template: TEMPLATES[id] }))
    .filter((entry) => Boolean(entry.template))
    .map(({ id, template }) => `### ${template.name} (\`${id}\`)
${template.description}

- **Trigger:** ${template.triggers.join(", ")}
- **Solves:** ${template.solves.join(", ")}
`)
    .join("\n");

  return `# Workflow Concept - ${tenantId}

**Generated:** ${generatedAt}
**Status:** DRAFT - operator review required before compile
**Tenant:** \`${tenantId}\`

---

## Discovery Input Status

| File | Status |
|------|--------|
| journey_map | ${journey ? "OK Provided" : "Missing"} |
| pain_points | ${pain ? "OK Provided" : "Missing"} |
| tools_inventory | ${tools ? "OK Provided" : "Missing"} |

---

## Customer Journey -> Automation Map

| # | Current Step | Workflow Template | n8n Node Type |
|---|---|---|---|
${stepRows || "| - | No steps parsed | - | - |"}

---

## Recommended Workflow Templates

${templateList}

---

## Deployment Order

Run in this sequence after \`inject_tenant_config.js\`:

${deployOrder.map((id, i) => `${i + 1}. \`${id}\``).join("\n")}

---

## Credentials Required

${buildCredentials(templateIds, tools)}

---

## Manual Steps Before Go-Live

${buildManualSteps(templateIds, tools)}

---

## Pain Points (raw)

${pain || "_Not provided_"}

---

## Tools Inventory (raw)

${tools || "_Not provided_"}

---

## Operator Sign-Off Checklist

- [ ] Journey map reviewed and steps are accurate
- [ ] All credential env vars set (not in discovery files)
- [ ] Tenant registered in \`control_plane_tenant_registry.json\`
- [ ] Package scope confirmed - no custom work outside approved templates
- [ ] Client has seen and approved the journey map in plain language

---

_Generated by \`api/discovery.ts\` (Flowstack Operator Tools)_
`;
}

async function emailConceptDoc(tenantId: string, conceptMd: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddr = process.env.FLOWSTACK_SALES_EMAIL_FROM;
  const toAddr = process.env.FLOWSTACK_SALES_EMAIL_TO;

  if (!apiKey || !fromAddr || !toAddr) return false;

  const attachmentB64 = Buffer.from(conceptMd, "utf8").toString("base64");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddr,
      to: [toAddr],
      subject: `Flowstack Discovery - workflow_concept.md for ${tenantId}`,
      text: `Workflow concept document generated for tenant: ${tenantId}\n\nReview the attached markdown file before running compile.\n\nDeployment order and credentials required are listed inside.`,
      attachments: [
        {
          filename: `workflow_concept_${tenantId}.md`,
          content: attachmentB64,
        },
      ],
    }),
  });

  return response.ok;
}

async function saveToAirtable(
  tenantId: string,
  journey: string,
  pain: string,
  tools: string,
  conceptMd: string
): Promise<{ saved: boolean; record_id?: string }> {
  const pat = process.env.FLOWSTACK_AIRTABLE_PAT;
  const baseId = process.env.FLOWSTACK_AIRTABLE_BASE_ID;
  if (!pat || !baseId) return { saved: false };

  try {
    const searchUrl = `https://api.airtable.com/v0/${baseId}/Clients?maxRecords=1&filterByFormula=${encodeURIComponent(`{tenant_id}="${tenantId}"`)}`;
    const searchRes = await fetch(searchUrl, { headers: { Authorization: `Bearer ${pat}` } });
    if (!searchRes.ok) return { saved: false };

    const searchData = await searchRes.json();
    const existing = searchData?.records?.[0];

    const fields: Record<string, unknown> = {
      tenant_id: tenantId,
      discovery_submitted: new Date().toISOString(),
      discovery_notes: [
        `=== JOURNEY MAP ===\n${journey}`,
        `=== PAIN POINTS ===\n${pain}`,
        `=== TOOLS INVENTORY ===\n${tools}`,
      ].join("\n\n"),
      workflow_concept: conceptMd,
      discovery_status: "concept_generated",
    };

    if (existing?.id) {
      const patchRes = await fetch(`https://api.airtable.com/v0/${baseId}/Clients/${existing.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      return { saved: patchRes.ok, record_id: existing.id };
    }

    const createRes = await fetch(`https://api.airtable.com/v0/${baseId}/Clients`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    if (!createRes.ok) return { saved: false };

    const created = await createRes.json();
    return { saved: true, record_id: created?.id };
  } catch {
    return { saved: false };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Discovery-Token, X-Operator-Key, X-Portal-Token");

  if (req.method === "OPTIONS") return res.status(204).end();

  const tenantId = resolveAuthorizedTenant(req);
  if (!tenantId) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Invalid or missing discovery token." });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      authorized: true,
      tenant_id: tenantId,
      access_mode: tenantId === "operator" ? "operator" : "client",
    });
  }

  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  const body = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "INVALID_BODY", message: "Expected JSON body." });
  }

  const requestedTenantId = String(body.tenant_id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 128);
  const effectiveTenantId = tenantId === "operator" ? requestedTenantId : tenantId;
  if (!effectiveTenantId) {
    return res.status(400).json({ error: "MISSING_TENANT_ID", message: "tenant_id is required." });
  }

  const resolvedInputs = await resolveDiscoveryInputs(body);
  const journey = resolvedInputs.journey.slice(0, 20000);
  const pain = resolvedInputs.pain.slice(0, 10000);
  const tools = resolvedInputs.tools.slice(0, 10000);

  if (!journey) {
    return res.status(400).json({
      error: "MISSING_JOURNEY_MAP",
      message: "journey_map is required. Provide text directly or upload a supported file.",
      extraction_errors: resolvedInputs.extractionErrors,
    });
  }

  const generatedAt = new Date().toISOString();
  const conceptMd = buildConceptDoc({ tenantId: effectiveTenantId, journey, pain, tools, generatedAt });

  const [emailSent, airtableResult] = await Promise.all([
    emailConceptDoc(effectiveTenantId, conceptMd),
    saveToAirtable(effectiveTenantId, journey, pain, tools, conceptMd),
  ]);

  return res.status(200).json({
    ok: true,
    tenant_id: effectiveTenantId,
    generated_at: generatedAt,
    templates: inferTemplates(journey, pain, tools),
    steps_parsed: parseSteps(journey).length,
    email_sent: emailSent,
    airtable: airtableResult,
    concept_md: conceptMd,
    extracted_files: resolvedInputs.extractionSummary,
    extraction_errors: resolvedInputs.extractionErrors,
  });
}
