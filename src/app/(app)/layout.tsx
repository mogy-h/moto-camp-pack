// ログイン後の画面で共通の背景。
// ログインの確認はここではなく各ページの requireUser() で行う（レイアウトはページを移動しても描き直されないため。
// Next.js のドキュメント authentication.md「Layouts and auth checks」）。
// ヘッダーは画面ごとに中身が違うので、ここには置かず各ページが <Header> を使う
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col bg-[radial-gradient(120%_50%_at_50%_0%,var(--color-neutral-100)_0%,var(--color-bg)_60%)]">
      {children}
    </div>
  );
}
