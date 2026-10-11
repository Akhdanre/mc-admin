import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Architectural boundary: src/server/domain/** must stay pure (no I/O).
  // All fs / child_process / zlib / rcon / cross-layer imports belong in
  // src/server/data/** or src/server/integrations/**.
  {
    files: ["src/server/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "fs", message: "domain must stay pure — move I/O into src/server/data" },
            { name: "fs/promises", message: "domain must stay pure — move I/O into src/server/data" },
            { name: "node:fs", message: "domain must stay pure — move I/O into src/server/data" },
            { name: "node:fs/promises", message: "domain must stay pure — move I/O into src/server/data" },
            { name: "child_process", message: "domain must stay pure — move exec into src/server/data" },
            { name: "node:child_process", message: "domain must stay pure — move exec into src/server/data" },
          ],
          patterns: [
            {
              group: ["@/server/data/*", "@/server/integrations/*", "@/server/services/*"],
              message: "domain must not depend on I/O or orchestration layers",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
