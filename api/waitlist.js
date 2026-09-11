const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_ORIGINS = new Set([
  "https://psmartking.com",
  "https://www.psmartking.com",
  "http://localhost:4180",
  "http://127.0.0.1:4180",
]);

function corsOrigin(req) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.has(origin)) return origin;
  if (process.env.VERCEL_URL && origin === `https://${process.env.VERCEL_URL}`) return origin;
  return "https://psmartking.com";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", corsOrigin(req));
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "invalid_email" });

  const webhook = process.env.WAITLIST_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.WAITLIST_NOTIFY_EMAIL || "psmartking@dnkvision.com";

  try {
    if (webhook) {
      const upstream = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          source: "psmartking-waitlist",
          createdAt: new Date().toISOString(),
        }),
      });
      if (!upstream.ok) throw new Error("webhook_failed");
    } else if (resendKey) {
      const from = process.env.RESEND_FROM || "P-SmartKing <onboarding@resend.dev>";
      const upstream = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [notifyTo],
          subject: "Nouvelle inscription liste d'attente P-SmartKing",
          text: `Courriel : ${email}\nSource : psmartking.com`,
        }),
      });
      if (!upstream.ok) throw new Error("resend_failed");
    } else {
      console.info("[waitlist]", email);
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: "upstream_failed" });
  }
}
