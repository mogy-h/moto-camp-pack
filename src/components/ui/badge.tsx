import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "group/badge inline-flex h-5.5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 text-2xs font-bold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      // デザインのタグは、どれも「200 の背景 + 800 の文字」。どの状態にどの色を使うかは使う側で決める
      // （例: イベントの準備中 = accent、下書き = neutral、完了 = accent-2）。
      // 品目の状態バッジは枠線も付くので、使う側で className="border-warn-500" のように足す
      variant: {
        neutral: "bg-neutral-200 text-neutral-800",
        accent: "bg-accent-200 text-accent-800",
        "accent-2": "bg-accent-2-200 text-accent-2-800",
        warn: "bg-warn-200 text-warn-800",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

function Badge({
  className,
  variant = "neutral",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
