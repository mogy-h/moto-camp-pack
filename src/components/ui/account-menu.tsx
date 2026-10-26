"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/actions/auth";

// メールアドレスは Supabase Auth のもの。ゲスト（#21）にはないので任意
type AccountMenuUser = {
  id: string;
  displayName: string;
  email?: string | null;
};

// ヘッダー右端のアカウントメニュー。「プロフィール設定」は #9 で /profile を作るまで置かない
function AccountMenu({ user }: { user: AccountMenuUser }) {
  return (
    <DropdownMenu>
      {/* 開いている間は Radix がボタンに data-state="open" を付ける。それを見て枠線・背景・矢印の向きを変える */}
      <DropdownMenuTrigger
        aria-label="アカウントメニュー"
        className="group flex h-9 shrink-0 items-center gap-1.75 rounded-full border border-neutral-300 px-1.5 transition-colors hover:bg-surface data-[state=open]:border-neutral-400 data-[state=open]:bg-surface"
      >
        <Avatar user={user} className="size-6.5" />
        <ChevronDown
          strokeWidth={2.75}
          className="mr-1.5 size-3.25 text-neutral-700 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </DropdownMenuTrigger>

      {/* デザインではボタンの右端にそろえて 8px 下に出る。幅は 232px */}
      <DropdownMenuContent align="end" sideOffset={8} className="w-53">
        <DropdownMenuLabel className="flex items-center gap-2.25 px-2.25 pt-2 pb-2.5 text-text">
          <Avatar user={user} className="size-7.75 text-xs" />
          <div className="min-w-0">
            <p className="text-sm leading-tight font-bold">
              {user.displayName}
            </p>
            {user.email && (
              <p className="mt-0.5 truncate text-xs text-neutral-700">
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="mt-0" />

        <DropdownMenuItem
          onSelect={() => signOut()}
          className="py-2.25 text-accent-700 focus:bg-accent-100"
        >
          <LogOut strokeWidth={2.75} />
          ログアウト
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AccountMenu };
