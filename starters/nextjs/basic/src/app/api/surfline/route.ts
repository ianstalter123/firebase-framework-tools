import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensures Node runtime (good for fetch + streaming)

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const spotId = searchParams.get("spotId"); // legacy numeric spot id (e.g., 2141)
  const days = searchParams.get("days") ?? "1";
  const units = searchParams.get("units") ?? "e"; // e=feet, m=meters
  const resources = searchParams.get("resources") ?? "surf,analysis,wind,weather,tide";

  if (!spotId) return jsonError("Missing spotId");

  // Legacy v1 endpoint described by many community clients; may change/break.
  // Example params align with surflinef docs.
  const url = new URL(`http://api.surfline.com/v1/forecasts/${spotId}`);
  url.searchParams.set("resources", resources);
  url.searchParams.set("days", days);
  url.searchParams.set("units", units);
  url.searchParams.set("aggregate", "true");

  try {
    const r = await fetch(url.toString(), {
      // basic caching to reduce repeated calls (Cloud Run + Next cache behavior varies)
      headers: { "user-agent": "foam-admin-surf-report/1.0" },
      // If you want Next cache semantics, you can experiment with:
      // next: { revalidate: 300 },
    });

    if (!r.ok) {
      return jsonError(`Surfline request failed: ${r.status} ${r.statusText}`, 502);
    }

    const data = await r.json();
    return NextResponse.json({ ok: true, spotId, data });
  } catch (e: any) {
    return jsonError(e?.message ?? "Unknown error fetching Surfline", 502);
  }
}
