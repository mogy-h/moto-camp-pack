import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm whitespace-nowrap transition-all select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      // 色と文字の太さだけを書く。形（角丸・高さ）は共通クラスと size で決める
      variant: {
        primary:
          "bg-accent-600 font-bold text-neutral-100 shadow-sm hover:bg-accent-700",
        secondary:
          "border-neutral-300 bg-transparent font-semibold text-neutral-800 hover:bg-neutral-200 aria-expanded:bg-neutral-200",
        ghost:
          "font-semibold text-accent hover:bg-accent/10 aria-expanded:bg-accent/10",
        // Organic に赤がないため accent-700 で代用中（globals.css の --destructive。#20 で見直す）
        destructive:
          "bg-destructive/10 font-semibold text-destructive hover:bg-destructive/20",
      },
      // --spacing が 4.4px なので h-10.5 = 46px、h-9 = 40px、size-7.5 = 33px
      size: {
        default: "h-10.5 gap-2 px-4.5",
        sm: "h-9 gap-1.5 px-3.5",
        icon: "size-9",
        "icon-sm": "size-7.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
