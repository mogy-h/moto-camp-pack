"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

// ダークモードは使わないので、shadcn の初期の形にあった next-themes（テーマの切り替え）は外した（Sonner の既定は light）。
// デザインにトーストはないため、色は Organic のトークンから選んだ（surface の背景・divider の枠線）。
// font-sans: Sonner は自前の font-family を持つので、アプリのフォントに戻す
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group font-sans"
      icons={{
        success: <CircleCheckIcon className="size-4" strokeWidth={2.75} />,
        info: <InfoIcon className="size-4" strokeWidth={2.75} />,
        warning: <TriangleAlertIcon className="size-4" strokeWidth={2.75} />,
        error: <OctagonXIcon className="size-4" strokeWidth={2.75} />,
        loading: <Loader2Icon className="size-4 animate-spin" strokeWidth={2.75} />,
      }}
      style={
        {
          "--normal-bg": "var(--color-surface)",
          "--normal-text": "var(--color-text)",
          "--normal-border": "var(--color-divider)",
          "--border-radius": "var(--radius-md)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
