import * as React from "react"
import { cn } from "cn"

// デザインの入力欄（ログイン・イベント作成など）に合わせる。角は rounded-md（ボタンと違い丸め切らない）。
// フォーカス時は枠線と背景を変え、globals.css の outline を枠線に重ねる（Organic の .input と同じく offset 0）
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10.5 w-full min-w-0 rounded-md border border-neutral-300 bg-neutral-200 px-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-accent-500 focus-visible:bg-neutral-100 focus-visible:outline-offset-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
