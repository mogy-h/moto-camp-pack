// ヘッダーに出す積み込みの進捗（「積み込み 2 / 11」とバー）
function PackProgress({
  progress,
}: {
  progress: { packed: number; total: number; ratio: number };
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      {/* 数は横の文字で読み上げられるので、バーは飾りとして読み上げから外す。幅は値で変わるので style で渡す */}
      <div
        aria-hidden
        className="h-2 w-18 overflow-hidden rounded-full bg-neutral-300 sm:w-24 lg:w-32"
      >
        <div
          className="h-full rounded-full bg-accent-2-500 transition-[width] duration-300"
          style={{ width: `${progress.ratio * 100}%` }}
        />
      </div>
      <span className="text-xs whitespace-nowrap text-neutral-700 tabular-nums">
        積み込み {progress.packed} / {progress.total}
      </span>
    </div>
  );
}

export { PackProgress };
