import { describe, it, expect } from "vitest";
import { safeNextPath } from "@/lib/next-path";

describe("safeNextPath", () => {
  it("招待リンクの形ならそのまま返す", () => {
    expect(safeNextPath("/j/abc_-123")).toBe("/j/abc_-123");
  });

  it("next が無ければダッシュボードに戻す", () => {
    expect(safeNextPath(undefined)).toBe("/"); // URL に ?next= が無いとき
    expect(safeNextPath(null)).toBe("/"); // フォームに next の欄が無いとき（formData.get は null を返す）
  });

  it("招待リンク以外のページには戻さない", () => {
    expect(safeNextPath("/events/xxx")).toBe("/");
  });

  // オープンリダイレクトを防ぐ
  it("外のサイトには戻さない", () => {
    expect(safeNextPath("https://example.com")).toBe("/");
    // "//" で始まると、ブラウザは「今と同じ https で example.com へ」と読む
    expect(safeNextPath("//example.com")).toBe("/");
  });

  it("/j/ の後ろに余計なものが付いていたら戻さない", () => {
    expect(safeNextPath("/j/abc/../../x")).toBe("/");
  });

  it("トークンが空なら戻さない", () => {
    expect(safeNextPath("/j/")).toBe("/");
  });

  it("文字列でなければ戻さない", () => {
    // ?next=a&next=b のように2つ付けると、searchParams では配列で届く
    expect(safeNextPath(["/j/abc"])).toBe("/");
  });
});
