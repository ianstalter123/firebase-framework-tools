"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const message = process.env["MESSAGE"] || "Hello!";
  const [surfReport, setSurfReport] = useState("");
  const [status, setStatus] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");

    if (!surfReport.trim()) {
      setStatus("Please enter a surf report.");
      return;
    }

    // Placeholder for now (replace with Firestore write later)
    console.log("Submitted surf report:", surfReport);

    setStatus("Submitted (console only).");
    setSurfReport("");
  }

  return (
    <main className="content">
      <h1 className="heading">Next.js on Firebase App Hosting!!!</h1>
      <p>{message}</p>

      {/* Simple input box (MVP) */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Admin: Add Surf Report</h2>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <input
            type="text"
            value={surfReport}
            onChange={(e) => setSurfReport(e.target.value)}
            placeholder="Type surf report here…"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(0,0,0,0.2)",
              color: "inherit",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={!surfReport.trim()}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: surfReport.trim()
                ? "rgba(255,255,255,0.12)"
                : "rgba(255,255,255,0.06)",
              cursor: surfReport.trim() ? "pointer" : "not-allowed",
              color: "inherit",
              fontWeight: 600,
            }}
          >
            Submit
          </button>
        </form>

        <p style={{ marginTop: 10, opacity: 0.85 }}>
          Preview: <span style={{ fontStyle: "italic" }}>{surfReport || "…"}</span>
        </p>

        {status ? <p style={{ marginTop: 8, opacity: 0.9 }}>{status}</p> : null}
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
