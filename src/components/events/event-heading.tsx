import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type EventHeadingProps = {
  event: { title: string; place: string | null; startDate: Date; endDate: Date };
  isDraft: boolean;
  memberCount: number;
  // 引き受け待ち（asking）のアイテムの数。誰宛てかは問わない
  askingCount: number;
};

// date 列は Prisma が UTC 0 時の Date で返すので、UTC のまま「11/7(土)」の形にする（event-card.tsx と同じ考え方）
const dayFormat = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
  timeZone: "UTC",
});

// 「11/7(土) – 11/8(日)」。日帰りは「11/7(土)・日帰り」（デザインの evRangeLabel）
function formatRange(startDate: Date, endDate: Date): string {
  const start = dayFormat.format(startDate);
  const end = dayFormat.format(endDate);
  return start === end ? `${start}・日帰り` : `${start} – ${end}`;
}

const CHIP =
  "inline-flex max-w-full items-center gap-1.5 rounded-full px-3.25 py-1.5 text-xs";

// タイトル・日程・場所・人数。場所はデザインにないが、ダッシュボードのカードと同じく出す
function EventHeading({ event, isDraft, memberCount, askingCount }: EventHeadingProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-2.75 sm:mb-6">
      <div className="min-w-0 flex-1 basis-64">
        <p className="mb-1.5 text-2xs tracking-widest text-neutral-600">ツーリング</p>
        <h1 className="text-2xl text-pretty sm:text-3xl">{event.title}</h1>
        {isDraft && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge>下書き</Badge>
            <span className="text-xs text-neutral-700">
              まだ公開されていません。公開すると招待リンクから参加できるようになります。
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-wrap gap-2">
        <span className={`${CHIP} bg-surface text-neutral-800`}>
          <CalendarDays strokeWidth={2.75} className="size-3.5 shrink-0" />
          {formatRange(event.startDate, event.endDate)}
        </span>
        {event.place && (
          <span className={`${CHIP} bg-surface text-neutral-800`}>
            <MapPin strokeWidth={2.75} className="size-3.5 shrink-0" />
            <span className="min-w-0 truncate">{event.place}</span>
          </span>
        )}
        <span className={`${CHIP} bg-accent-2-200 text-accent-2-800`}>
          <Users strokeWidth={2.75} className="size-3.5 shrink-0" />
          {memberCount}名 ·{" "}
          {askingCount > 0 ? `引き受け待ち ${askingCount}件` : "引き受け待ちなし"}
        </span>
      </div>
    </div>
  );
}

export { EventHeading };
