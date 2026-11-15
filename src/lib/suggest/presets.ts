import type { Suggestion } from "@/lib/validation/schemas";

// Gemini API が失敗したときに出す定番の共同装備（必要性の高い順）。
// 登録済みのものは excludeExisting で除いてから、先頭から出す
export const PRESET_SUGGESTIONS: Suggestion[] = [
  { name: "タープ", size: "L" },
  { name: "焚き火台", size: "M" },
  { name: "ランタン", size: "S" },
  { name: "クーラーボックス", size: "L" },
  { name: "調理用バーナー", size: "S" },
  { name: "クッカーセット", size: "M" },
  { name: "ウォータージャグ", size: "M" },
  { name: "ローテーブル", size: "M" },
  { name: "薪", size: "L" },
  { name: "救急セット", size: "S" },
];
