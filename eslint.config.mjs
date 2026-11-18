import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 整形は prettier に任せ、ぶつかる ESLint の書き方のルールを切る（Next.js のドキュメントの推奨）。
  // 前の設定のルールを上書きするので、ルールの設定の後に置く
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific:
    "docs/**", // デザイン参照用の書き出し（自分で書くコードではない）
    "src/generated/**", // Prisma が生成するコード
  ]),
]);

export default eslintConfig;
