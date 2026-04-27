import { createHash } from "node:crypto";
import type { NextConfig } from "next";

const themeBootstrapScript = `(function(){try{if(!/^\\/dashboard/.test(location.pathname))return;var t=localStorage.getItem("magic-theme")||"light";if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})()`;
const themeScriptHash = createHash("sha256").update(themeBootstrapScript).digest("base64");

// Shared CSP directives. The only one that varies between embed and
// non-embed responses is `frame-ancestors`: `'none'` keeps customer
// dashboards from being framed, `*` lets the embed routes render
// inside any customer site. We deliberately do NOT also set
// X-Frame-Options — modern browsers prefer CSP frame-ancestors, and
// having both with conflicting intents (the bug the audit caught) is
// worse than having neither for legacy IE.
function buildCsp(scriptSrc: string, frameAncestors: string): string {
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    `frame-ancestors ${frameAncestors}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const scriptSrc = isDevelopment
      ? ["'self'", "https://js.stripe.com", "'unsafe-inline'", "'unsafe-eval'"].join(" ")
      : ["'self'", `'sha256-${themeScriptHash}'`, "https://js.stripe.com"].join(" ");

    const baseHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    return [
      // Embed routes: framed by customer sites, so frame-ancestors *.
      // No X-Frame-Options at all (the only useful XFO value for
      // arbitrary parent origins is missing — `ALLOW-FROM` is
      // deprecated and ignored by modern browsers).
      {
        source: "/embed/:path*",
        headers: [
          ...baseHeaders,
          { key: "Content-Security-Policy", value: buildCsp(scriptSrc, "*") },
        ],
      },
      // Everything else: dashboards, public pages, API routes — must
      // not be framed. CSP frame-ancestors 'none' is the modern
      // equivalent of X-Frame-Options DENY.
      {
        source: "/((?!embed).*)",
        headers: [
          ...baseHeaders,
          { key: "Content-Security-Policy", value: buildCsp(scriptSrc, "'none'") },
        ],
      },
    ];
  },
};

export default nextConfig;
