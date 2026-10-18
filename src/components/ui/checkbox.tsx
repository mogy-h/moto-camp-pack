"use client"

import * as React from "react"
import { cn } from "cn"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { CheckIcon } from "lucide-react"

// デザインで使うチェックは「積み込み済み」の丸いチェックだけなので、その見た目にする（四角いチェックボックスはない）。
// after: で押せる範囲を見た目より広げる（size-6 + 上下左右 2 = 44px。スマホで押しやすい大きさ）
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-neutral-400 text-accent-2-100 transition-colors after:absolute after:-inset-2 disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive data-checked:border-accent-2-600 data-checked:bg-accent-2-600",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon strokeWidth={2.75} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
