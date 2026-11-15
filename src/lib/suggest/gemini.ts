import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { suggestionSchema, type Suggestion } from "@/lib/validation/schemas";
import { SUGGEST_SYSTEM_INSTRUCTION } from "@/lib/suggest/prompt";

// Gemini に返してもらう JSON の形。Gemini に渡す JSON Schema と、返ってきた答えの検証の両方にこれを使う。
// 件数は縛らない（多く返ってきても excludeExisting で MAX_SUGGESTIONS 件に切る。縛ると、6件来たときに全部捨てることになる）
const responseSchema = z.object({
  suggestions: z.array(suggestionSchema),
});

// 待つ時間の上限。SDK は既定ではタイムアウトしないので、ここで決める
const TIMEOUT_MS = 10_000;

// Gemini に候補を聞く。失敗したとき（キーが未設定・通信エラー・タイムアウト・形の違う答え）は例外を投げる。
// 定番リストへの切り替えは、呼び出す側（Server Action）で行う
export async function fetchGeminiSuggestions(
  prompt: string,
): Promise<Suggestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  // ① apiKey か model のどちらかが未設定なら、Error を投げる
  if (!apiKey || !model) throw new Error("Geminiの設定が読み込めませんでした");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: SUGGEST_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json", // 答えを JSON だけにする
      responseJsonSchema: z.toJSONSchema(responseSchema), // その JSON の形を指定する
      httpOptions: { timeout: TIMEOUT_MS },
    },
  });

  // ② response.text（答えの JSON の文字列）が空なら、Error を投げる
  const text = response.text;
  if (!text) throw new Error("Gemini の答えが空でした");

  // ③ JSON.parse で文字列をオブジェクトにし、responseSchema.parse で形を確かめる
  const parsed = responseSchema.parse(JSON.parse(text));

  // ④ 確かめた値の suggestions を返す
  return parsed.suggestions;
}
