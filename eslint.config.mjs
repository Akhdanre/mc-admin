import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 1. Client code must never import from server/
  {
    files: [
      "src/components/**/*.ts",
      "src/components/**/*.tsx",
      "src/hooks/**/*.ts",
      "src/lib/**/*.ts",
      "src/app/page.tsx",
      "src/app/layout.tsx",
      "src/app/providers.tsx",
      "src/app/login/**/*.ts",
      "src/app/login/**/*.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/**"],
              message: "Client code must never import from server/",
            },
          ],
        },
      ],
    },
  },
  // 2. server/core cannot import feature modules
  {
    files: ["src/server/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/server/access*",
                "@/server/auth*",
                "@/server/backup*",
                "@/server/chat*",
                "@/server/discord*",
                "@/server/mods*",
                "@/server/players*",
                "@/server/rcon*",
                "@/server/settings*",
                "@/server/world*",
              ],
              message: "server/core cannot import feature modules",
            },
          ],
        },
      ],
    },
  },
  // 3. Features must only be imported via their index (no deep imports)
  {
    files: ["src/app/api/**/*.ts", "src/server/**/*.ts", "src/instrumentation.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/server/auth/*",
                "@/server/backup/*",
                "@/server/chat/*",
                "@/server/discord/*",
                "@/server/mods/*",
                "@/server/players/*",
                "@/server/rcon/*",
                "@/server/settings/*",
                "@/server/world/*",
              ],
              message: "Server features must only be imported via their feature index (e.g. '@/server/auth')",
            },
          ],
        },
      ],
    },
  },
  // 4. Pure parsers and time math must stay pure (no I/O)
  {
    files: ["src/server/*/parse.ts", "src/server/*/time.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "fs", message: "Parsers must stay pure (no fs I/O)" },
            { name: "fs/promises", message: "Parsers must stay pure (no fs I/O)" },
            { name: "node:fs", message: "Parsers must stay pure (no fs I/O)" },
            { name: "node:fs/promises", message: "Parsers must stay pure (no fs I/O)" },
            { name: "child_process", message: "Parsers must stay pure (no exec I/O)" },
            { name: "node:child_process", message: "Parsers must stay pure (no exec I/O)" },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
