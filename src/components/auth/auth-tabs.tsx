import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/login", label: "ログイン" },
  { href: "/signup", label: "新規登録" },
] as const;

// ログイン / 新規登録の切り替え。1つの画面の中で表示を切り替えるのではなく、2つの URL へのリンクにする
// （proxy が URL で判断するのに合わせるため。ブラウザの「戻る」も自然に効く）
export function AuthTabs({
  current,
}: {
  current: (typeof TABS)[number]["href"];
}) {
  return (
    <nav
      aria-label="ログインと新規登録の切り替え"
      className="mb-5 flex gap-1 rounded-full bg-neutral-200 p-1"
    >
      {TABS.map((tab) => {
        const active = tab.href === current;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-8.5 flex-1 items-center justify-center rounded-full text-sm transition-colors",
              active
                ? "bg-neutral-100 font-bold text-accent-700 shadow-sm"
                : "font-medium text-neutral-700 hover:text-neutral-900",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
