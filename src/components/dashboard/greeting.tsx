import { fromDateString } from "@/lib/date";

// 「2026年10月25日」と「日」を別に作り、デザインどおり全角のかっこでつなぐ
// （ja-JP の weekday をそのまま使うと半角のかっこになるため）
const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});
const weekdayFormat = new Intl.DateTimeFormat("ja-JP", {
  weekday: "short",
  timeZone: "UTC",
});

// ダッシュボード上部のあいさつ。today は日本時間の今日（"YYYY-MM-DD"。todayInTokyo() の値）。
// children には右側に置くボタン（「イベントを作成」）を渡す
function Greeting({
  displayName,
  today,
  children,
}: {
  displayName: string;
  today: string;
  children?: React.ReactNode;
}) {
  const date = fromDateString(today);

  return (
    <div className="mb-4.5 flex flex-wrap items-end gap-3 sm:mb-6">
      <div className="min-w-0 flex-[1_1_18rem]">
        <p className="mb-1.5 text-2xs tracking-widest text-neutral-600">
          {dateFormat.format(date)}（{weekdayFormat.format(date)}）
        </p>
        <h1 className="text-2xl sm:text-3xl">
          おかえりなさい、{displayName}さん
        </h1>
      </div>
      {children}
    </div>
  );
}

export { Greeting };
