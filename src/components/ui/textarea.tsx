import * as React from "react"
import { cn } from "cn"

// 見た目は Input と同じ。field-sizing-content で、入力した行数に合わせて高さが伸びる
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-20 w-full resize-none rounded-md border border-neutral-300 bg-neutral-200 px-3 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-accent-500 focus-visible:bg-neutral-100 focus-visible:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
