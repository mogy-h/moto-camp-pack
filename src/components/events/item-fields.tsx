"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SIZE_LABEL } from "@/components/events/item-parts";
import type { BoardItem } from "@/components/events/types";

const SIZES = ["S", "M", "L"] as const;

type ItemFieldsProps = {
  defaultName?: string; // 編集のときは今の値を渡す。追加のときは省いて空欄から始める
  defaultSize?: BoardItem["size"];
};

// ギア名・かさばり具合の入力欄。共同装備の追加・借りたいギアのリクエスト・アイテムの編集で共通。
// form・送信ボタン・説明文はモーダルごとに違うので、ここには入れない。
// 入力欄の name（name / size）は、各 Server Action が formData.get で読む名前と一致させる
function ItemFields({ defaultName = "", defaultSize = "M" }: ItemFieldsProps) {
  // 同じ部品を複数のモーダルで使うので、id は固定の文字列にせず useId で作る
  const id = useId();
  const nameId = `${id}-name`;
  const sizeLabelId = `${id}-size-label`;

  // React 19 は送信後にフォームを空に戻すので、エラーのときに入力が消えないよう state で持つ。
  // useState の初期値は最初の表示でしか使われないが、モーダルを閉じるとこの部品も消えるので、
  // 開き直すたびに、そのときの defaultName / defaultSize から始まる
  const [name, setName] = useState(defaultName);
  const [size, setSize] = useState<string>(defaultSize);

  return (
    // フラグメントで返し、親の form の flex の並び（gap）にそのまま入れる
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={nameId}>ギア名</Label>
        <Input
          id={nameId}
          name="name"
          placeholder="例：ヘキサタープ"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {/* ラジオボタンの集まりには for で結びつけられないので、aria-labelledby で見出しを読み上げる */}
        <Label asChild id={sizeLabelId}>
          <span>かさばり具合（運ぶ人の判断材料）</span>
        </Label>
        <RadioGroup
          name="size"
          aria-labelledby={sizeLabelId}
          value={size}
          onValueChange={setSize}
        >
          {SIZES.map((value) => (
            <RadioGroupItem key={value} value={value}>
              {SIZE_LABEL[value]}
            </RadioGroupItem>
          ))}
        </RadioGroup>
      </div>
    </>
  );
}

export { ItemFields };
