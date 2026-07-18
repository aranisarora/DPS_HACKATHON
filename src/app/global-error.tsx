"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "Georgia, serif", background: "#10201B", color: "#F2EDE0" }}>
        <main style={{ display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 500, fontStyle: "italic" }}>
              Donna hit a snag.
            </h1>
            <p style={{ color: "#8FA396", marginTop: 8 }}>Something went wrong.</p>
            <button
              onClick={reset}
              style={{
                marginTop: 20, padding: "10px 24px", borderRadius: 3,
                background: "#C2A25B", color: "#1D1B14", border: 0, cursor: "pointer",
                fontWeight: 500,
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
