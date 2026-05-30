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
    "thekstocks-automation/venv/**",
    "thekstocks-automation/**",
    "imports/**",
    "old req/**",
    ".claude/**",
    ".playwright-mcp/**",
    ".review-slices/**",
    "*.pdf",
    "*.xlsx",
    "*.png",
  ]),
  {
    rules: {
      // Keep the core React hooks rules, but do not fail CI on the newer
      // React Compiler advisory rules until the app is intentionally migrated
      // to compiler-clean patterns.
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      // Catch accidental `any` usage — helps enforce type safety
      "@typescript-eslint/no-explicit-any": "warn",
      // Warn on console.log left in code (allow warn/error)
      "no-console": ["warn", { allow: ["warn", "error", "debug"] }],
    },
  },
]);

export default eslintConfig;
