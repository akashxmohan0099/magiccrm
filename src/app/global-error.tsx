"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Global error boundary for the entire application.
 * Catches errors in the root layout and all routes.
 * This is a Next.js convention file.
 */
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#fafaf9",
          color: "#1a1a1a",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "16px",
                backgroundColor: "#c8e6c0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  backgroundColor: "#fff",
                  borderRadius: "6px",
                }}
              />
            </div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                marginBottom: "8px",
                letterSpacing: "-0.02em",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#6b6b6b",
                marginBottom: "24px",
                lineHeight: 1.5,
              }}
            >
              An unexpected error occurred. Our team has been notified.
              {error.digest && (
                <span style={{ display: "block", marginTop: "8px", fontSize: "12px", color: "#999" }}>
                  Error ID: {error.digest}
                </span>
              )}
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  backgroundColor: "#1a1a1a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                style={{
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  backgroundColor: "#fff",
                  color: "#1a1a1a",
                  border: "1px solid #e5e5e5",
                  borderRadius: "10px",
                  textDecoration: "none",
                  display: "inline-block",
                }}
              >
                Go home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
