import type { Suggestion } from "@/lib/validation/schemas";

// 比べるときだけ使う形。全角・半角、空白、大文字・小文字の違いをなくす（表示する名前は変えない）
// NFKC: 全角の英数字を半角に、半角のカタカナを全角にそろえる（"ＬＥＤ" → "LED"、"ﾀｰﾌﾟ" → "タープ"）
function normalizeName(name: string): string {
  return name.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

// 登録済みと同じ名前の候補と、候補どうしの重複を除き、先頭から max 件にする
export function excludeExisting(
  candidates: Suggestion[],
  existingNames: string[],
  max: number,
): Suggestion[] {
  // ① 登録済みの名前を、それぞれ normalizeName した Set を作る（map を使う）
  const seen = new Set(existingNames.map(normalizeName));
  const result: Suggestion[] = [];

  for (const candidate of candidates) {
    const key = normalizeName(candidate.name);
    // ② seen に key があれば、この候補は飛ばす（continue）
    if (seen.has(key)) {
      continue;
    }
    // ③ なければ、seen に key を足し、result に candidate を入れる
    seen.add(key);
    result.push(candidate);
    // ④ result が max 件になったら、ループを終える（break）
    if (result.length === max) {
      break;
    }
  }
  return result;
}
