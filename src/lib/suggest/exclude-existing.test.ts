import { describe, expect, it } from "vitest";
import { excludeExisting } from "@/lib/suggest/exclude-existing";
import type { Suggestion } from "@/lib/validation/schemas";

describe("excludeExisting", () => {
  it("登録済みと同じ名前を除く", () => {
    const candidates: Suggestion[] = [
      { name: "タープ", size: "L" },
      { name: "ランタン", size: "S" },
    ];
    const existing = ["タープ"];
    expect(excludeExisting(candidates, existing, 5)).toEqual([
      { name: "ランタン", size: "S" },
    ]);
  });
  it("全角・半角・空白・大文字小文字の違いも同じとみなす", () => {
    const candidates: Suggestion[] = [
      { name: "ＬＥＤ ランタン", size: "S" },
      { name: "ﾀｰﾌﾟ", size: "L" },
    ];
    const existing = ["LEDランタン", "タープ"];
    expect(excludeExisting(candidates, existing, 5)).toEqual([]);
  });
  it("候補どうしの重複は最初の1つだけ残す", () => {
    const candidates: Suggestion[] = [
      { name: "焚き火台", size: "M" },
      { name: "焚き火台", size: "L" },
    ];
    const existing: string[] = [];
    expect(excludeExisting(candidates, existing, 5)).toEqual([
      { name: "焚き火台", size: "M" },
    ]);
  });
  it("max 件で切る", () => {
    const candidates: Suggestion[] = [
      { name: "A", size: "L" },
      { name: "B", size: "S" },
      { name: "C", size: "S" },
    ];
    const existing: string[] = [];
    expect(excludeExisting(candidates, existing, 2)).toEqual([
      { name: "A", size: "L" },
      { name: "B", size: "S" },
    ]);
  });
  it("部分一致は除かない", () => {
    const candidates: Suggestion[] = [{ name: "ヘキサタープ", size: "L" }];
    const existing = ["タープ"];
    expect(excludeExisting(candidates, existing, 5)).toEqual([
      { name: "ヘキサタープ", size: "L" },
    ]);
  });
});
