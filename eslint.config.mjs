import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", ".claude/**"],
  },
  {
    // QA 러너(tests/*.cjs)는 Node CommonJS 스크립트다 — 번들에 들어가지 않으므로
    // ESM import 강제 규칙 대상이 아니다. playwright를 require로 로드해야 실행된다.
    files: ["tests/**/*.cjs", "scripts/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default eslintConfig;
