import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const spotId = searchParams.get("spotId");
  const days = searchParams.get("days") ?? "1";
  const intervalHours = searchParams.get("intervalHours") ?? "1";

  if (!spotId) return jsonError("Missing spotId");

  const upstream = new URL("https://services.surfline.com/kbyg/spots/forecasts/wave");
  upstream.searchParams.set("spotId", spotId);
  upstream.searchParams.set("days", days);
  upstream.searchParams.set("intervalHours", intervalHours);

  try {
    const r = await fetch(upstream.toString(), {
      // keep it simple; you can add caching later
      headers: {
        "user-agent": "foam-admin-surf-report/1.0",
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return jsonError(
        `Upstream Surfline error: ${r.status} ${r.statusText}${text ? ` - ${text.slice(0, 200)}` : ""}`,
        502
      );
    }

    const data = await r.json();
    return NextResponse.json({ ok: true, spotId, data });
  } catch (e: any) {
    return jsonError(e?.message ?? "Failed to fetch Surfline", 502);
  }
}
