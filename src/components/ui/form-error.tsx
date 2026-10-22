import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// フォームの送信エラー（Server Action が返した { ok: false, error } の error）を表示する。
// role="alert": 表示されたときに、スクリーンリーダーがすぐ読み上げる
export function FormError({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-md bg-accent-200 px-3 py-2.5 text-xs leading-relaxed text-accent-800",
        className,
      )}
    >
      <CircleAlert strokeWidth={2.75} className="mt-0.5 size-4 shrink-0" />
      <span className="flex-1">{message}</span>
    </div>
  );
}
