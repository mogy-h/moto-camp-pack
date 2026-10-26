"use client";

import { useState } from "react";
import { Mountain, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EventCard,
  type EventCardProps,
} from "@/components/dashboard/event-card";
import { LIMITS } from "@/lib/validation/limits";

const TABS = [
  { value: "upcoming", label: "予定" },
  { value: "done", label: "完了" },
  { value: "all", label: "すべて" },
] as const;

type Tab = (typeof TABS)[number]["value"];

// ダッシュボードのイベント一覧。イベントは多くても数十件なので、ページから全件を受け取り、
// タブと検索の絞り込みはブラウザの中で行う（URL には残さない。docs/progress.md #10 のメモ）
function EventList({ cards }: { cards: EventCardProps[] }) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [query, setQuery] = useState("");

  const counts: Record<Tab, number> = {
    upcoming: cards.filter((item) => item.phase !== "done").length,
    done: cards.filter((item) => item.phase === "done").length,
    all: cards.length,
  };

  const keyword = query.trim().toLowerCase();

  const visible = cards.filter((card) => {
    if (tab === "done" && card.phase !== "done") return false;
    if (tab === "upcoming" && card.phase === "done") return false;

    if (keyword) {
      return (
        card.event.title.toLowerCase().includes(keyword) ||
        (card.event.place ?? "").toLowerCase().includes(keyword)
      );
    }

    return true;
  });

  return (
    // value と onValueChange を渡すと、選ばれているタブを Radix ではなくこちらの state で持てる。
    // onValueChange には string が届くが、値は TABS の value だけなので Tab として扱ってよい
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as Tab)}
      className="gap-0"
    >
      <div className="mb-3.25 flex flex-wrap items-center gap-2">
        <TabsList>
          {TABS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value}>
              {label}
              <span className="rounded-full bg-neutral-200 px-1.5 text-2xs tabular-nums group-data-active/tab:bg-neutral-100/25">
                {counts[value]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <span className="min-w-2.75 flex-1" />

        {/* 入力欄そのものの outline は消し、外側の丸い枠にフォーカスの outline を出す（入力欄なので offset 0） */}
        <label className="flex h-9 min-w-41 flex-[0_1_15rem] items-center gap-2 rounded-full border bg-surface px-3.25 focus-within:outline-2 focus-within:outline-offset-0 focus-within:outline-accent">
          <Search
            strokeWidth={2.75}
            className="size-3.5 shrink-0 text-neutral-600"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={LIMITS.searchKeyword}
            placeholder="イベントを検索"
            aria-label="イベントを検索"
            className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-neutral-600 focus-visible:outline-none"
          />
        </label>
      </div>

      {/* 選ばれているタブの中身だけを出す（value に今のタブを渡すので、常にこの1つが表示される） */}
      <TabsContent value={tab}>
        {visible.length > 0 ? (
          <div className="flex flex-col gap-2.75">
            {visible.map((item) => (
              <EventCard key={item.event.id} {...item} />
            ))}
          </div>
        ) : (
          <EmptyState searching={query.trim() !== ""} />
        )}
      </TabsContent>
    </Tabs>
  );
}

// 何も表示するものがないとき。検索中かどうかで文言を変える（デザインの文言）
function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-surface/60 px-4.5 py-10 text-center sm:py-16">
      <div className="mx-auto mb-3.25 flex size-12 items-center justify-center rounded-full bg-accent-200 text-accent-700">
        <Mountain strokeWidth={2.75} className="size-6" />
      </div>
      <p className="mb-1.5 font-heading text-base">
        {searching
          ? "該当するイベントがありません"
          : "まだイベントがありません"}
      </p>
      <p className="mx-auto max-w-68 text-xs leading-relaxed text-neutral-700">
        {searching
          ? "キーワードを変えて検索してみてください。"
          : "「イベントを作成」から、次のツーリングの積載リストを作りましょう。"}
      </p>
    </div>
  );
}

export { EventList };
