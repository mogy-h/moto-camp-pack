"use client"

import * as React from "react"
import { cn } from "cn"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"

// S・M・L（小物 / 中くらい / かさばる）などを、横に並んだ丸いボタンから1つ選ぶ。
// <form> の中では Radix が隠れた input を出力するので、name を付ければ FormData で値が届く
function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("flex w-full gap-1.5", className)}
      {...props}
    />
  )
}

// 項目そのものをボタンの形にし、選ばれた項目を塗る（shadcn の初期の形の「丸い点」は使わない）。
// 未選択の項目だけ、ホバーで背景を付ける
function RadioGroupItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "inline-flex h-10 flex-1 items-center justify-center rounded-full border border-neutral-300 px-2 text-xs text-neutral-800 transition-colors disabled:cursor-not-allowed disabled:opacity-45 data-unchecked:hover:bg-neutral-200 data-checked:border-accent-600 data-checked:bg-accent-600 data-checked:font-bold data-checked:text-accent-100",
        className
      )}
      {...props}
    >
      {children}
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
