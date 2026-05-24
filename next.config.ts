import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js inlines runtime scripts + styles; 'unsafe-inline'
              // is unavoidable today. Tighten with nonces in a follow-up.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://api.twilio.com https://*.twilio.com https://*.myfatoorah.com https://*.sentry.io https://*.ingest.sentry.io",
              "frame-src 'self' https://*.myfatoorah.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://*.myfatoorah.com",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

// Wrap with Sentry only when org/project envs are present, so local dev
// and PR previews without Sentry creds don't fail.
const sentryWrapped =
  process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
    ? withSentryConfig(nextConfig, {
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        silent: !process.env.CI,
        widenClientFileUpload: true,
        tunnelRoute: "/monitoring",
        disableLogger: true,
        automaticVercelMonitors: true,
      })
    : nextConfig;

export default sentryWrapped;
