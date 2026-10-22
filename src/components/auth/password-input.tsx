"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// パスワード欄。目のアイコンで、見せる・隠すを切り替える（スマホで打ち間違いに気づけるように）。
// type は中で切り替えるので、外からは受け取らない
export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        className={cn("pr-11", className)}
        {...props}
      />
      {/* 入力欄（46px）の中で上下中央に置く: (46 - 33) / 2 ≒ top-1.5（6.6px） */}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setVisible((current) => !current)}
        aria-label="パスワードを表示"
        aria-pressed={visible}
        className="absolute top-1.5 right-1.5 text-neutral-700 hover:bg-neutral-200"
      >
        {visible ? <EyeOff strokeWidth={2.75} /> : <Eye strokeWidth={2.75} />}
      </Button>
    </div>
  );
}
