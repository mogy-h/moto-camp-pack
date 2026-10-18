// 日付のヘルパ。出発日・帰着日のような「カレンダー上の日付」は "YYYY-MM-DD" の文字列で扱う
// サーバー（Vercel）は UTC で動くので、マシンの地域の時刻に頼らない

// 日本時間の今日を "YYYY-MM-DD" で返す
// now を引数にしているのは、テストで時刻を固定するため（省略すると現在時刻）
// sv-SE（スウェーデン語）は、日付を YYYY-MM-DD の形式で出力する
export function todayInTokyo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(
    now,
  );
}

// DB の date 列（Prisma は「その日の UTC 0 時」の Date で返す）→ "YYYY-MM-DD"
// toISOString() は常に UTC で出力するので、どの地域で動かしても日付がずれない
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// "YYYY-MM-DD"（フォームの値など）→ DB の date 列に渡す Date（UTC 0 時）
// 末尾の Z（UTC）を付けないと、動いているマシンの地域の 0 時として解釈され、1日ずれることがある
export function fromDateString(ymd: string): Date {
  return new Date(`${ymd}T00:00:00Z`);
}
