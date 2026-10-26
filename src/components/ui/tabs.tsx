"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Tabs as TabsPrimitive } from "radix-ui"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

// ダッシュボードのタブに合わせる。shadcn の初期の見た目（灰色の帯の中にタブが並ぶ）ではなく、
// 丸いボタンを間隔を空けて並べるだけにする
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit flex-wrap items-center gap-2 group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "",
        line: "gap-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

// 選ばれていないタブ: 枠線だけ。選ばれたタブ: accent-600 で塗る（data-active は Radix の data-state="active"）。
// フォーカスは shadcn の ring を外し、globals.css の outline に任せる。
// 中の要素を選択状態で変えたいときは、group/tab を付けて group-data-active/tab: で書く
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "group/tab inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-neutral-300 px-3.5 text-sm font-medium whitespace-nowrap text-neutral-800 transition-colors not-data-active:hover:bg-neutral-200 disabled:pointer-events-none disabled:opacity-45 data-active:border-transparent data-active:bg-accent-600 data-active:font-bold data-active:text-neutral-100 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
