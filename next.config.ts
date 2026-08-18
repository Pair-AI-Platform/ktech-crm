import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "framer-motion",
      "date-fns",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-popover",
      "@radix-ui/react-scroll-area",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
    ],
  },

  webpack: (config) => {
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
      generator: {
        emit: false,
      },
    });
    return config;
  },

  outputFileTracingRoot: process.cwd(),
  outputFileTracingExcludes: {
    "/**": [
      "./thekstocks-automation/**",
      "./imports/**",
      "./old req/**",
      "./*.pdf",
      "./*.xlsx",
      "./*.png",
    ],
  },

  async redirects() {
    return [
      {
        source: "/puc-psp",
        destination: "/puc",
        permanent: true,
      },
    ];
  },

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
            value:
              "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
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
              "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://api.twilio.com https://*.twilio.com https://*.myfatoorah.com https://*.sentry.io https://*.ingest.sentry.io https://adl.dev.k8s.trypair.ai",
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
    ? (() =>
        import("@sentry/nextjs").then(({ withSentryConfig }) =>
          withSentryConfig(nextConfig, {
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            silent: !process.env.CI,
            widenClientFileUpload: true,
            tunnelRoute: "/monitoring",
            disableLogger: true,
            automaticVercelMonitors: true,
          }),
        ))()
    : nextConfig;

export default sentryWrapped;
