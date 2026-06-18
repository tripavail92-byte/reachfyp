import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Generated build output uses custom dist dirs (see next.config.ts); never lint it.
    ignores: [".next/**", ".next-build/**", ".next-dev/**", "next-env.d.ts"],
  },
];

export default config;