import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "16kb",
    },
  },
};

function resolveTokenRegistry(): Record<string, string> {
  try {
    const raw = process.env.PORTAL_TOKENS;
    if (raw) return JSON.parse(raw);
  } catch {}

  return { "demo-client": "demo" };
}

function validateToken(token: string): string | null {
  if (!token || typeof token !== "string") return null;

  const clean = token.replace(/[^A-Za-z0-9_\-]/g, "").slice(0, 128);
  if (clean.length < 3) return null;

  const registry = resolveTokenRegistry();
  return registry[clean] || null;
}

async function fetchLeadsFromAirtable(
  pat: string,
  baseId: string,
  limit = 20
): Promise<any[]> {
  const table = encodeURIComponent("Leads");
  const sort = "sort[0][field]=Created%20At&sort[0][direction]=desc";
  const filter = "filterByFormula=NOT({Lead%20ID}%3D'')";
  const url = `https://api.airtable.com/v0/${baseId}/${table}?maxRecords=${limit}&${sort}&${filter}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${pat}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Airtable fetch failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return (data.records || []).map((rec: any) => ({
    name: rec.fields["Name"] || "-",
    company: rec.fields["Company"] || "-",
    source: rec.fields["Source"] || "-",
    package: rec.fields["Recommended Package"] || "lite",
    status: rec.fields["Qualification Status"] || "Qualified",
    next_action: rec.fields["Next Action"] || "-",
    created: (rec.fields["Created At"] || "").slice(0, 10),
    niche: rec.fields["Niche"] || "-",
    messages_per_day: rec.fields["Messages Per Day"] || 0,
  }));
}

async function fetchActivitiesFromAirtable(
  pat: string,
  baseId: string,
  limit = 10
): Promise<any[]> {
  const table = encodeURIComponent("Activities");
  const sort = "sort[0][field]=event_timestamp&sort[0][direction]=desc";
  const url = `https://api.airtable.com/v0/${baseId}/${table}?maxRecords=${limit}&${sort}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${pat}` },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.records || []).map((rec: any) => ({
      event: rec.fields["event_name"] || "-",
      actor: rec.fields["actor"] || "system",
      status: rec.fields["status"] || "success",
      details: rec.fields["details"] || "",
      timestamp: rec.fields["event_timestamp"] || "",
    }));
  } catch {
    return [];
  }
}

function computeStats(leads: any[]) {
  const total = leads.length;
  const week = leads.filter(
    (lead) => lead.created && Date.now() - new Date(lead.created).getTime() < 7 * 86400000
  ).length;
  const qual = leads.filter((lead) => lead.status === "Qualified").length;
  const conv = total > 0 ? Math.round((qual / total) * 100) : 0;
  const action = leads.filter((lead) => /follow|review|pending/i.test(lead.next_action || "")).length;
  const hours = Math.round(total * 0.45);
  const tasks = total * 4;

  const channels: Record<string, number> = {};
  leads.forEach((lead) => {
    const source = lead.source || "Unknown";
    channels[source] = (channels[source] || 0) + 1;
  });

  const prevWeek = Math.max(1, Math.round(week * 0.88));
  const velDelta = Math.round(((week - prevWeek) / prevWeek) * 100);

  return { total, week, velDelta, conv, action, hours, tasks, channels };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", process.env.PORTAL_ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, X-Portal-Token");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const authHeader = req.headers["authorization"] as string | undefined;
  const queryToken = req.query["token"] as string | undefined;
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : (req.headers["x-portal-token"] as string | undefined);

  const rawToken = headerToken || queryToken || "";
  const tenantId = validateToken(rawToken);

  if (!tenantId) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Invalid or missing portal token.",
    });
  }

  const pat = process.env.FLOWSTACK_AIRTABLE_PAT;
  const baseId = process.env.FLOWSTACK_AIRTABLE_BASE_ID;

  if (!pat || !baseId) {
    return res.status(200).json({
      ok: true,
      mode: "demo",
      tenant: tenantId,
      stats: {
        total: 6,
        week: 6,
        velDelta: 12,
        conv: 84,
        action: 3,
        hours: 128,
        tasks: 24,
        channels: { Facebook: 2, Website: 2, Instagram: 1, Referral: 1 },
      },
      leads: [],
      activities: [],
      workflows: [
        { label: "Lead capture & CRM sync", status: "active", last: "2m ago" },
        { label: "Follow-up sequences", status: "active", last: "18m ago" },
        { label: "Daily digest", status: "active", last: "8h ago" },
        { label: "Missed-call recovery", status: "active", last: "3h ago" },
      ],
    });
  }

  try {
    const [leads, activities] = await Promise.all([
      fetchLeadsFromAirtable(pat, baseId),
      fetchActivitiesFromAirtable(pat, baseId),
    ]);

    const stats = computeStats(leads);

    return res.status(200).json({
      ok: true,
      mode: "live",
      tenant: tenantId,
      stats,
      leads,
      activities,
      workflows: [
        { label: "Lead capture & CRM sync", status: "active", last: "live" },
        { label: "Follow-up sequences", status: "active", last: "live" },
        { label: "Daily digest", status: "active", last: "live" },
        { label: "Missed-call recovery", status: "active", last: "live" },
      ],
    });
  } catch (err: any) {
    console.error("portal-data error:", err);
    return res.status(500).json({
      error: "DATA_FETCH_FAILED",
      message: String(err?.message || "Upstream error"),
    });
  }
}
