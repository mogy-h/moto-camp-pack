"use client";

import { useState } from "react";
import { Funnel, X } from "lucide-react";
import { AddSharedItemDialog } from "@/components/events/add-shared-item-dialog";
import { MemberCard } from "@/components/events/member-card";
import { RentalRow } from "@/components/events/rental-row";
import { SharedRow } from "@/components/events/shared-row";
import { StatusBadge } from "@/components/events/item-parts";
import { cn } from "@/lib/utils";
import type { BoardItem, BoardMember } from "@/components/events/types";

function needsAttention(item: BoardItem, meId: string): boolean {
  if (item.status === "open") return true;
  if (item.status === "unassigned") return true;
  if (item.carrierId === meId && item.status === "asking") return true;
  return false;
}

function involves(item: BoardItem, memberId: string): boolean {
  switch (item.kind) {
    case "RENTAL":
      if (memberId === item.carrierId) return true;
      if (memberId === item.requesterId) return true;
      return false;
    case "SHARED":
      if (memberId === item.carrierId) return true;
      return false;
  }
}

const RENTAL_LEGEND = [
  { status: "open", note: "貸せる人がいない" },
  { status: "asking", note: "指定した相手の返事待ち" },
  { status: "confirmed", note: "貸す人が引き受け済み" },
] as const;

type EventBoardProps = {
  eventId: string;
  members: BoardMember[];
  items: BoardItem[];
  meId: string; // 見ている本人の EventMember の id
};

// メンバーカードと2つのリスト。絞り込みの状態を持つので Client Component にする。
// アイテムは多くても数十件なので、ページから全件を受け取り、絞り込みはブラウザの中で行う（ダッシュボードと同じ）
function EventBoard({ eventId, members, items, meId }: EventBoardProps) {
  // カードで選んだメンバー（EventMember の id）。null なら絞り込まない
  const [memberFilter, setMemberFilter] = useState<string | null>(null);
  const [onlyAttention, setOnlyAttention] = useState(false);

  // 行に借りたい人・貸す人・運ぶ人のアバターと名前を出すため、id からメンバーを引けるようにする
  const memberById = new Map(members.map((member) => [member.id, member]));
  const memberOf = (id: string | null) =>
    id === null ? undefined : memberById.get(id);
  const selectedMember = memberOf(memberFilter);

  const attentionCount = items.filter((item) =>
    needsAttention(item, meId),
  ).length;

  const visible = items.filter((item) => {
    if (onlyAttention && !needsAttention(item, meId)) return false;
    if (memberFilter !== null && !involves(item, memberFilter)) return false;
    return true;
  });

  const rentals = visible.filter((item) => item.kind === "RENTAL");
  const shared = visible.filter((item) => item.kind === "SHARED");

  return (
    <>
      <section className="mb-5 sm:mb-8">
        <div className="mb-2.25 flex items-baseline justify-between gap-2.25">
          <h2 className="text-base">メンバーの積載</h2>
          <span className="text-2xs text-neutral-600">
            カードをタップで絞り込み
          </span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,16.25rem),1fr))] gap-2.75">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              eventId={eventId}
              member={member}
              selected={member.id === memberFilter}
              // 選んでいるカードをもう一度押したら解除する
              onSelect={() =>
                setMemberFilter(member.id === memberFilter ? null : member.id)
              }
            />
          ))}
        </div>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={onlyAttention}
          onClick={() => setOnlyAttention(!onlyAttention)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm whitespace-nowrap transition-colors",
            onlyAttention
              ? "bg-accent-600 font-bold text-accent-100"
              : "border border-neutral-300 font-medium text-neutral-800 hover:bg-surface",
          )}
        >
          <Funnel strokeWidth={2.75} className="size-3.5 shrink-0" />
          調整が必要なものだけ
          <span
            className={cn(
              "rounded-full px-1.75 text-2xs font-bold text-accent-800 tabular-nums",
              onlyAttention ? "bg-accent-100" : "bg-accent-200",
            )}
          >
            {attentionCount}
          </span>
        </button>

        {selectedMember && (
          <button
            type="button"
            onClick={() => setMemberFilter(null)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent-2-600 pr-2.75 pl-3.75 text-xs font-semibold whitespace-nowrap text-accent-2-100"
          >
            {selectedMember.user.displayName}の担当分
            <X strokeWidth={2.75} className="size-3.5 shrink-0" aria-hidden />
            <span className="sr-only">（絞り込みを解除）</span>
          </button>
        )}
      </div>

      <section className="mb-6 sm:mb-8.5">
        <SectionHeading
          title="ギアの貸し借り"
          description="借りたい人のリクエストに、最初に「自分が貸す」を押した人が貸します（早い者勝ち）。運搬は原則「貸す人」のバイク。積めるかどうかは本人が判断します。"
        />
        <div className="mb-2.25 flex flex-wrap gap-2">
          {RENTAL_LEGEND.map(({ status, note }) => (
            <StatusBadge
              key={status}
              status={status}
              note={note}
              className="h-6 font-semibold"
            />
          ))}
        </div>
        {rentals.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {rentals.map((item) => (
              <RentalRow
                key={item.id}
                item={item}
                requester={memberOf(item.requesterId)}
                carrier={memberOf(item.carrierId)}
              />
            ))}
          </ul>
        ) : (
          <EmptyList>貸し借りのリクエストはありません</EmptyList>
        )}
      </section>

      <section>
        <SectionHeading
          title="共同装備の分担"
          description="全員で使う大型ギア。運搬は最初に「自分が運ぶ」を押した人に決まります。"
          action={<AddSharedItemDialog eventId={eventId} />}
        />
        {shared.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {shared.map((item) => (
              <SharedRow
                key={item.id}
                eventId={eventId}
                item={item}
                carrier={memberOf(item.carrierId)}
                canDelete={item.createdById === meId}
              />
            ))}
          </ul>
        ) : (
          <EmptyList>共同装備はまだありません</EmptyList>
        )}
      </section>

      <p className="mt-4.5 text-xs leading-relaxed text-neutral-700">
        積めるかどうかはバイクとキャリアによって違うため、上限はアプリでは持ちません。積めるかどうかは本人だけが判断し、他の人の担当は変更できません。
      </p>
    </>
  );
}

function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode; // 見出しの右に置くボタン
}) {
  return (
    <div className="mb-2.25 flex flex-wrap items-end gap-2.75">
      <div className="min-w-0 flex-[1_1_15rem]">
        <h2 className="text-lg">{title}</h2>
        <p className="mt-0.75 text-xs leading-relaxed text-neutral-700">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}

function EmptyList({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface px-4.5 py-7 text-center text-sm text-neutral-700">
      {children}
    </div>
  );
}

export { EventBoard };
