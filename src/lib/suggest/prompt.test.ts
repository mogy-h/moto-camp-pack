import { describe, expect, it } from "vitest";
import {
  buildSuggestPrompt,
  type SuggestPromptInput,
} from "@/lib/suggest/prompt";

const base: SuggestPromptInput = {
  place: "ふもとっぱら",
  startDate: "2026-11-21",
  endDate: "2026-11-22",
  memberCount: 4,
  existingNames: ["タープ", "焚き火台"],
};

describe("buildSuggestPrompt", () => {
  it("場所が未入力なら「未定」", () => {
    const prompt = buildSuggestPrompt({ ...base, place: null });
    expect(prompt).toContain("キャンプ場: 未定");
  });
  it("場所・日程・人数・登録済みが入る", () => {
    const prompt = buildSuggestPrompt({ ...base });
    expect(prompt).toContain("ふもとっぱら");
    expect(prompt).toContain("1泊2日");
    expect(prompt).toContain("人数: 4人");
    expect(prompt).toContain("タープ、焚き火台");
  });
  it("出発日と帰着日が同じなら「日帰り」", () => {
    const prompt = buildSuggestPrompt({ ...base, endDate: "2026-11-21" });
    expect(prompt).toContain("日帰り");
  });
  it("月をまたいでも泊数が合う", () => {
    const prompt = buildSuggestPrompt({
      ...base,
      startDate: "2026-11-30",
      endDate: "2026-12-02",
    });
    expect(prompt).toContain("2泊3日");
  });
  it("登録済みがなければ「なし」", () => {
    const prompt = buildSuggestPrompt({ ...base, existingNames: [] });
    expect(prompt).toContain("なし");
  });
});
