import { Motorbike } from "lucide-react";

// ログイン・新規登録で共通の枠（ロゴ・キャッチコピー・カード）。
// (auth) はルートグループ（かっこのフォルダは URL に入らない）なので、URL は /login・/signup のまま
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(120%_60%_at_50%_0%,var(--color-neutral-100)_0%,var(--color-bg)_62%)] px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-3.5 flex size-14 items-center justify-center rounded-lg bg-accent-600 text-neutral-100 shadow-md">
            <Motorbike strokeWidth={2.75} className="size-8" />
          </div>
          <p className="font-display text-2xl leading-tight text-accent-700">
            MotoCamp Pack
          </p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            キャンプツーリングの積載を、
            <br />
            メンバー全員で持ち寄る。
          </p>
        </div>
        <div className="rounded-lg border bg-surface p-5 shadow-md sm:p-6">
          {children}
        </div>
      </div>
    </main>
  );
}
