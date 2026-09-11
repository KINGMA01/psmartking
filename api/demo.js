/**
 * Proxy lecture seule vers l'API ParkSmart (démo publique site marketing).
 * Variables Vercel : PARKSMART_API_URL (ex. https://api.psmartking.com)
 */

const ALLOWED = new Set(["segments/polylines", "segments/chunk-detail"]);
const MAX_PER_MIN = 40;
const hits = new Map();

function clientIp(req) {
  const fwd = (req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || req.socket?.remoteAddress || "unknown";
}

function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  if (list.length >= MAX_PER_MIN) return false;
  list.push(now);
  hits.set(ip, list);
  return true;
}

function cors(req, res) {
  const origin = req.headers.origin || "";
  const allowed = [
    "https://psmartking.com",
    "https://www.psmartking.com",
    "http://localhost:4180",
    "http://127.0.0.1:4180",
  ];
  if (process.env.VERCEL_URL) {
    allowed.push(`https://${process.env.VERCEL_URL}`);
  }
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "method" });

  const backend = (process.env.PARKSMART_API_URL || "").replace(/\/+$/, "");
  if (!backend) {
    return res.status(503).json({ error: "demo_unconfigured", detail: "PARKSMART_API_URL manquant" });
  }

  const path = String(req.query.path || "").trim();
  if (!ALLOWED.has(path)) {
    return res.status(400).json({ error: "path_not_allowed" });
  }

  if (!rateLimit(clientIp(req))) {
    return res.status(429).json({ error: "rate_limit" });
  }

  const url = new URL(`/api/${path}`, backend);
  Object.entries(req.query).forEach(([key, value]) => {
    if (key === "path" || value == null) return;
    url.searchParams.set(key, String(value));
  });

  if (path === "segments/polylines") {
    const limit = Number(url.searchParams.get("limit") || 200);
    url.searchParams.set("limit", String(Math.min(Math.max(limit, 10), 220)));
    const radius = Number(url.searchParams.get("radius") || 1);
    url.searchParams.set("radius", String(Math.min(Math.max(radius, 0.05), 1.5)));
    if (!url.searchParams.has("split_stalls")) url.searchParams.set("split_stalls", "false");
  }

  try {
    const upstream = await fetch(url.toString(), {
      headers: { Accept: "application/json", "User-Agent": "P-SmartKing-Site-Demo/1.0" },
    });
    const body = await upstream.text();
    res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
    res.status(upstream.status).setHeader("Content-Type", "application/json").send(body);
  } catch (err) {
    res.status(502).json({ error: "upstream_failed" });
  }
}
