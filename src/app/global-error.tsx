"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "system-ui", background: "#FAFAF8", color: "#16161A" }}>
        <main style={{ display: "grid", placeItems: "center", minHeight: "100vh", textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 500 }}>Donna hit a snag.</h1>
            <p style={{ color: "#5A5A66", marginTop: 8 }}>The error has been reported.</p>
            <button
              onClick={reset}
              style={{
                marginTop: 20, padding: "10px 24px", borderRadius: 999,
                background: "#16161A", color: "#fff", border: 0, cursor: "pointer",
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
