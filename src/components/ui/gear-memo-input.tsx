import * as React from "react";
import { Input } from "@/components/ui/input";
import { LIMITS } from "@/lib/validation/limits";

// 積載装備のメモの入力欄 + プリセットタグ（docs/screens.md「共通パーツ」）。
// イベント詳細のメモ編集で使う。イベント作成・プロフィール・ゲスト参加でも同じものを使える
const GEAR_PRESETS = [
  "トップケース",
  "サイドバッグ",
  "シートバッグ",
  "リアキャリア",
  "タンクバッグ",
  "長物OK",
];

// - memo が空なら preset だけ（例: "" + "トップケース" → "トップケース"）
// - そうでなければ「、」でつなぐ（例: "リアキャリア" + "トップケース" → "リアキャリア、トップケース"）
function appendPreset(memo: string, preset: string): string {
  if (memo.trim() === "") return preset;
  return `${memo}、${preset}`;
}

// value・onChange 以外（id・name・placeholder など）は、そのまま Input に渡す
type GearMemoInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
};

function GearMemoInput({ value, onChange, ...props }: GearMemoInputProps) {
  return (
    <div>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      <div className="mt-2.25 flex flex-wrap gap-1.5">
        {GEAR_PRESETS.map((preset) => {
          const next = appendPreset(value, preset);
          // 追記すると上限を超えるタグは押せなくする（screens.md「プリセットタグを追記した後も上限内に収める」）。
          // 文字数は zod と同じく Array.from で数える
          const tooLong = Array.from(next).length > LIMITS.gearMemo;
          return (
            <button
              key={preset}
              type="button"
              disabled={tooLong}
              onClick={() => onChange(next)}
              aria-label={`${preset}を追記`}
              className="h-7.25 rounded-full border border-dashed border-neutral-400 px-2.75 text-2xs text-neutral-800 transition-colors hover:border-solid hover:bg-surface disabled:pointer-events-none disabled:opacity-45"
            >
              <span aria-hidden>＋ </span>
              {preset}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { GearMemoInput };
