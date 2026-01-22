"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Spot = { label: string; spotId: string };

export default function Home() {
  const message = process.env["MESSAGE"] || "Hello!";

  // San Clemente area spotIds (from Surfline URLs)
  const spots: Spot[] = [
    { label: "T-Street", spotId: "5842041f4e65fad6a7708830" },
    { label: "San Clemente State Beach", spotId: "5842041f4e65fad6a77088cf" },
    { label: "Lower Trestles", spotId: "5842041f4e65fad6a770888a" },
    { label: "San Onofre State Beach", spotId: "584204204e65fad6a77099d4" },
  ];

  const [selectedSpotId, setSelectedSpotId] = useState(spots[0].spotId);
  const selectedSpotLabel = useMemo(
    () => spots.find((s) => s.spotId === selectedSpotId)?.label ?? "Selected spot",
    [selectedSpotId]
  );

  const [surfReport, setSurfReport] = useState("");
  const [status, setStatus] = useState("");
  const [loadingForecast, setLoadingForecast] = useState(false);

  const canSubmit = useMemo(() => surfReport.trim().length > 0, [surfReport]);

  function formatSurflineDraft(json: any) {
    // KBYG wave endpoint often returns:
    // { data: { wave: [{ surf: { min, max, optimalScore? }, ... , timestamp }] }, associated: {...} }
    const first = json?.data?.wave?.[0];
    const min = first?.surf?.min;
    const max = first?.surf?.max;

    const range =
      typeof min === "number" && typeof max === "number" ? `${min}-${max} ft` : "N/A";

    const ts =
      typeof first?.timestamp === "number"
        ? new Date(first.timestamp * 1000).toLocaleString()
        : "";

    return [
      `${selectedSpotLabel} (Surfline auto-draft)`,
      "",
      `Wave range (first interval): ${range}`,
      ts ? `Timestamp: ${ts}` : "",
      "",
      "Admin notes:",
    ]
      .filter(Boolean)
      .join("\n");
  }

    async function fetchSurflineForecast() {
    setStatus("");
    setLoadingForecast(true);

    try {
      const url = new URL("/api/surfline/wave", window.location.origin);
      url.searchParams.set("spotId", selectedSpotId);
      url.searchParams.set("days", "1");
      url.searchParams.set("intervalHours", "1");

      const r = await fetch(url.toString(), { cache: "no-store" });
      const j = await r.json();

      if (!r.ok || !j?.ok) {
        setStatus(j?.error ?? `Request failed: ${r.status} ${r.statusText}`);
        return;
      }

      const draft = formatSurflineDraft(j.data);
      setSurfReport(draft);
      setStatus("Forecast loaded into the textbox.");
    } catch (e: any) {
      setStatus(e?.message ?? "Error fetching forecast.");
    } finally {
      setLoadingForecast(false);
    }
  }


  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    if (!surfReport.trim()) {
      setStatus("Please enter a surf report.");
      return;
    }

    // Placeholder for now (replace with Firestore write later)
    console.log("Submitted surf report:", {
      spotId: selectedSpotId,
      spotName: selectedSpotLabel,
      text: surfReport,
    });

    setStatus("Submitted (console only).");
    setSurfReport("");
  }

  return (
    <main className="content">
      <h1 className="heading">Next.js on Firebase App Hosting!!!</h1>
      <p>{message}</p>

      {/* Admin / forecast-assisted input */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Admin: Add Surf Report</h2>

        <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
          <label style={{ fontSize: 14, opacity: 0.9 }}>San Clemente spot</label>

          <select
            value={selectedSpotId}
            onChange={(e) => setSelectedSpotId(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.2)",
              color: "inherit",
              outline: "none",
            }}
          >
            {spots.map((s) => (
              <option key={s.spotId} value={s.spotId}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchSurflineForecast}
            disabled={loadingForecast}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: loadingForecast
                ? "rgba(255,255,255,0.06)"
                : "rgba(255,255,255,0.12)",
              cursor: loadingForecast ? "not-allowed" : "pointer",
              color: "inherit",
              fontWeight: 600,
            }}
          >
            {loadingForecast ? "Fetching…" : "Fetch from Surfline"}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <textarea
            value={surfReport}
            onChange={(e) => setSurfReport(e.target.value)}
            placeholder="Write the surf report here… (or fetch from Surfline)"
            rows={9}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.2)",
              color: "inherit",
              outline: "none",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: canSubmit
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.06)",
              cursor: canSubmit ? "pointer" : "not-allowed",
              color: "inherit",
              fontWeight: 600,
            }}
          >
            Submit
          </button>
        </form>

        {status ? <p style={{ marginTop: 10, opacity: 0.9 }}>{status}</p> : null}
      </section>

      <section className="features">
        <article className="card">
          <h2>Scalable, serverless backends</h2>
          <p>
            Dynamic content is served by{" "}
            <Link
              href="https://cloud.google.com/run/docs/overview/what-is-cloud-run"
              target="_blank"
              rel="noopener noreferrer"
            >
              Cloud Run
            </Link>
            , a fully managed container that scales up and down with demand. Visit{" "}
            <Link href="/ssr">
              <code>/ssr</code>
            </Link>{" "}
            and{" "}
            <Link href="/ssr/streaming">
              <code>/ssr/streaming</code>
            </Link>{" "}
            to see the server in action.
          </p>
        </article>

        <article className="card">
          <h2>Global CDN</h2>
          <p>
            Cached content is served by{" "}
            <Link
              href="https://cloud.google.com/cdn/docs/overview"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Cloud CDN
            </Link>
            , a fast and secure way to host cached content globally. Visit{" "}
            <Link href="/ssg">
              <code>/ssg</code>
            </Link>{" "}
          </p>
        </article>
      </section>
    </main>
  );
}
