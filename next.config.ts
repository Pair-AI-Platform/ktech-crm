import type { NextConfig } from "next";
import type { Configuration } from "webpack";

// Bundle analyzer configuration - using dynamic import to avoid ESLint issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },

  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    '/api/**/*': [],
  },
  outputFileTracingExcludes: {
    "/**": [
      "./thekstocks-automation/**",
      "./imports/**",
      "./old req/**",
      "./*.pdf",
      "./*.xlsx",
      "./*.png",
      "node_modules/@swc/core-linux-x64-gnu/**",
      "node_modules/@swc/core-linux-x64-musl/**",
      "node_modules/@swc/core-darwin-x64/**",
      "node_modules/@swc/core-darwin-arm64/**",
      "node_modules/@esbuild/**",
      "node_modules/webpack/**",
      "node_modules/rollup/**",
      "node_modules/terser/**",
      "node_modules/@imgly/background-removal/dist/*.wasm",
      "node_modules/onnxruntime-web/**/*.wasm",
      ".next/cache/**",
      ".next/trace",
      "**/*.map",
      "**/*.md",
      "**/*.txt",
      "**/test/**",
      "**/tests/**",
      "**/__tests__/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
    ],
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'framer-motion',
    ],
  },

  serverExternalPackages: [
    '@sentry/nextjs',
    'twilio',
    'openai',
    '@ai-sdk/anthropic',
    '@ai-sdk/openai',
    '@imgly/background-removal',
    'xlsx',
    'resend',
  ],

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  webpack: (config: Configuration, { isServer, dev }) => {
    // Don't externalize in development
    if (dev) return config;

    // Externalize heavy dependencies in production
    if (!isServer) {
      config.externals = config.externals || [];
      
      // Add CDN externals for client-side bundles
      if (Array.isArray(config.externals)) {
        config.externals.push({
          // These will be loaded from CDN
          // 'recharts': 'Recharts',
          // 'framer-motion': 'FramerMotion',
        });
      }
    }

    // Optimize bundle splitting
    if (config.optimization) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for shared dependencies
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Separate chunks for heavy libraries
          recharts: {
            name: 'recharts',
            test: /[\\/]node_modules[\\/]recharts[\\/]/,
            priority: 30,
          },
          supabase: {
            name: 'supabase',
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            priority: 30,
          },
          radix: {
            name: 'radix',
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            priority: 30,
          },
        },
      };
    }

    return config;
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

// Wrap with bundle analyzer
export default withBundleAnalyzer(sentryWrapped);

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
