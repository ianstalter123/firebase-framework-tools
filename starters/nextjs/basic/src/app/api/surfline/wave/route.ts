import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CacheEntry = {
  at: number;       // ms epoch
  ttlMs: number;    // ms
  data: any;        // upstream JSON
};

declare global {
  // eslint-disable-next-line no-var
  var __surflineWaveCache: Map<string, CacheEntry> | undefined;
}

const cache: Map<string, CacheEntry> =
  global.__surflineWaveCache ?? (global.__surflineWaveCache = new Map());

function jsonError(message: string, status = 400, extra?: Record<string, any>) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, timeoutMs: number, init?: RequestInit) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchWithRetries(url: string, init: RequestInit, opts: {
  attempts: number;         // total attempts including first
  timeoutMs: number;
  baseBackoffMs: number;    // first backoff
}) {
  let lastErrText: string | null = null;

  for (let i = 0; i < opts.attempts; i++) {
    const attempt = i + 1;

    try {
      const r = await fetchWithTimeout(url, opts.timeoutMs, init);

      if (r.ok) return r;

      // Capture a small snippet for debugging
      const text = await r.text().catch(() => "");
      lastErrText = `${r.status} ${r.statusText}${text ? ` - ${text.slice(0, 200)}` : ""}`;

      // Retry on typical transient classes (403/429/5xx)
      if (![403, 429, 500, 502, 503, 504].includes(r.status)) {
        return r; // non-retryable
      }
    } catch (e: any) {
      lastErrText = e?.name === "AbortError" ? "timeout" : (e?.message ?? "fetch error");
    }

    // Backoff with jitter
    if (attempt < opts.attempts) {
      const jitter = Math.floor(Math.random() * 150);
      const backoff = opts.baseBackoffMs * Math.pow(2, i) + jitter;
      await sleep(backoff);
    }
  }

  // Synthesize a failure response-like object
  return { ok: false, status: 599, statusText: lastErrText ?? "unknown error" } as any;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const spotId = searchParams.get("spotId");
  const days = searchParams.get("days") ?? "1";
  const intervalHours = searchParams.get("intervalHours") ?? "1";

  if (!spotId) return jsonError("Missing spotId");

  // Cache key: include query params that affect output
  const key = `${spotId}|days=${days}|intervalHours=${intervalHours}`;

  // Serve fresh cache if valid
  const now = Date.now();
  const existing = cache.get(key);
  if (existing && now - existing.at < existing.ttlMs) {
    return NextResponse.json({ ok: true, spotId, data: existing.data, cached: true });
  }

  const upstream = new URL("https://services.surfline.com/kbyg/spots/forecasts/wave");
  upstream.searchParams.set("spotId", spotId);
  upstream.searchParams.set("days", days);
  upstream.searchParams.set("intervalHours", intervalHours);

  const token = process.env.SURFLINE_ACCESS_TOKEN;
  if (token) upstream.searchParams.set("accesstoken", token);

  const init: RequestInit = {
    headers: {
      // These headers can marginally improve success rate; not guaranteed
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      accept: "application/json,text/plain,*/*",
      referer: "https://www.surfline.com/",
      origin: "https://www.surfline.com",
    },
    cache: "no-store",
  };

  const r = await fetchWithRetries(upstream.toString(), init, {
    attempts: 3,        // 1 + 2 retries
    timeoutMs: 6000,    // keep it tight for admin UX
    baseBackoffMs: 250,
  });

  // If success, cache and return
  if (r.ok) {
    const data = await r.json();
    cache.set(key, { at: now, ttlMs: 10 * 60 * 1000, data }); // 10 minutes
    return NextResponse.json({ ok: true, spotId, data, cached: false });
  }

  // If failure, serve stale cache if we have it
  if (existing) {
    return NextResponse.json({
      ok: true,
      spotId,
      data: existing.data,
      cached: true,
      stale: true,
      warning: `Surfline upstream error; served cached data instead (${r.statusText ?? "error"})`,
    });
  }

  return jsonError(`Upstream Surfline error: ${r.statusText ?? "unknown"}`, 502);
}
