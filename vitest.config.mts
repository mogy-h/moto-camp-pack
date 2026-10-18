import { defineConfig } from "vitest/config";

// lib/derive・日付ヘルパなど、DB と React に依存しない純関数のテスト用。
// React コンポーネントのテストは今は書かないので、jsdom や Testing Library は入れていない
export default defineConfig({
  resolve: {
    tsconfigPaths: true, // @/ の import を tsconfig.json の paths で解決する
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
