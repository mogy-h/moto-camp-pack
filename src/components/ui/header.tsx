import Link from "next/link";
import { cn } from "@/lib/utils";

// 画面ごとにヘッダーの中身が違う（ダッシュボード: ロゴ・アカウントメニュー、イベント詳細: 積み込み・招待・追加 など）ので、
// 共通にするのは枠（上に固定・背景のぼかし）だけ。中身は各ページが children で渡す。
// デザインでは中身を本文と同じ最大幅（1080px）で中央に寄せているが、PC でもロゴとメニューが画面の両端に来るよう、幅は制限しない
function Header({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-divider bg-bg/88 backdrop-blur-md">
      <div
        className={cn(
          "flex items-center gap-2.75 px-3 py-2.75 sm:px-6",
          className,
        )}
      >
        {children}
      </div>
    </header>
  );
}

// デザインではロゴは飾りだが、イベント詳細には戻るボタンがないので、ダッシュボードへのリンクにしている
function HeaderLogo() {
  return (
    <Link
      href="/"
      className="shrink-0 rounded-sm font-display text-lg text-accent-700"
    >
      MotoCamp Pack
    </Link>
  );
}

export { Header, HeaderLogo };
