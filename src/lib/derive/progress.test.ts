import { describe, expect, it } from "vitest";
import { progress } from "@/lib/derive/progress";

describe("progress", () => {
  it("4件のうち1件が積み込み済み", () => {
    const items = [
      { packedAt: new Date() },
      { packedAt: null },
      { packedAt: null },
      { packedAt: null },
    ];
    expect(progress(items)).toEqual({ packed: 1, total: 4, ratio: 0.25 });
  });
  it("4件とも積み込み済み", () => {
    const items = [
      { packedAt: new Date() },
      { packedAt: new Date() },
      { packedAt: new Date() },
      { packedAt: new Date() },
    ];
    expect(progress(items)).toEqual({ packed: 4, total: 4, ratio: 1 });
  });
  it("4件とも未積み込み", () => {
    const items = [
      { packedAt: null },
      { packedAt: null },
      { packedAt: null },
      { packedAt: null },
    ];
    expect(progress(items)).toEqual({ packed: 0, total: 4, ratio: 0 });
  });
  it("空の配列が渡った時、0 ÷ 0 で NaN にならない", () => {
    expect(progress([])).toEqual({ packed: 0, total: 0, ratio: 0 });
  });
});
