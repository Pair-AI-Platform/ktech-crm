import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".vercel/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "__tests__/**",
  ]),
  {
    rules: {
      // Catch accidental `any` usage — helps enforce type safety
      "@typescript-eslint/no-explicit-any": "warn",
      // Warn on console.log left in code (allow warn/error)
      "no-console": ["warn", { allow: ["warn", "error", "debug"] }],
    },
  },
]);

export default eslintConfig;
