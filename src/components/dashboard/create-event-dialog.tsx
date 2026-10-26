"use client";

import { Info, Motorbike, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { createEvent } from "@/actions/events";
import { type ActionResult } from "@/lib/action-result";

const initialState: ActionResult = { ok: true, data: undefined };

// profile: 車種・積載装備のメモの初期値（ログイン中のユーザーのプロフィール）。today: 出発日に選べる最初の日（日本時間の今日）
type Props = {
  profile: { bike: string | null; gearMemo: string | null };
  today: string;
};

function CreateEventDialog({ profile, today }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shrink-0">
          <Plus strokeWidth={2.75} className="size-4.5" />
          イベントを作成
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-96">
        <DialogTitle>新しいイベント</DialogTitle>
        {/* 見えない説明。モーダルを開いたときにスクリーンリーダーが読む（Radix は説明がないと警告を出す） */}
        <DialogDescription className="sr-only">
          イベント名と日程を入力して、新しいイベントを作成します
        </DialogDescription>

        {/* モーダルを閉じると DialogContent の中身は消える（アンマウント）。フォームを別のコンポーネントにしておくと、
            その中の state（入力・エラー）も一緒に消えるので、開くたびに初期状態から始まる */}
        <CreateEventForm
          profile={profile}
          today={today}
          onCreated={() => {
            setOpen(false);
            toast.success("イベントを作成しました");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// 入力欄の name（title / startDate / endDate / place / bike / gearMemo）は、createEvent が formData.get で読む名前と一致させる。
// onCreated: 作成に成功したときに呼ぶ（モーダルを閉じるのは親の CreateEventDialog の役目）
function CreateEventForm({
  profile,
  today,
  onCreated,
}: Props & { onCreated: () => void }) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await createEvent(prev, formData);
      if (result.ok) onCreated();
      return result;
    },
    initialState,
  );

  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bike, setBike] = useState(profile.bike ?? "");
  const [gearMemo, setGearMemo] = useState(profile.gearMemo ?? "");

  // 車種がプロフィールにあれば「初期値にしています」、なければ「プロフィールにも保存されます」（デザインの文言）
  const hasProfileBike = profile.bike !== null;

  return (
    // noValidate: ブラウザ標準のチェックを止め、エラーの表示を zod の日本語のメッセージにそろえる
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">イベント名</Label>
        <Input
          id="title"
          name="title"
          placeholder="例）伊豆 1泊2日 キャンプツーリング"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="flex gap-2.25">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label htmlFor="startDate">出発日</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            min={today}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label htmlFor="endDate">帰着日</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            min={startDate || today}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="place">
          目的地
          <span className="text-2xs font-medium text-neutral-600">任意</span>
        </Label>
        <Input
          id="place"
          name="place"
          placeholder="例）朝霧ジャンボリー"
          value={place}
          onChange={(event) => setPlace(event.target.value)}
        />
      </div>

      {/* あなたのバイク・積載装備（accent-2 の囲み） */}
      <div className="rounded-md border border-accent-2-200 bg-accent-2-100 p-3.25">
        <p className="mb-2.25 flex items-center gap-1.5 text-xs font-bold text-accent-2-800">
          <Motorbike strokeWidth={2.75} className="size-4" />
          あなたのバイク・積載装備
        </p>
        <div className="flex flex-col gap-2.25">
          <div className="flex flex-col gap-1.25">
            <Label htmlFor="bike" className="text-accent-2-800">
              車種
            </Label>
            <Input
              id="bike"
              name="bike"
              placeholder="例）SEROW 250"
              className="focus-visible:border-accent-2-600"
              value={bike}
              onChange={(event) => setBike(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.25">
            <Label htmlFor="gearMemo" className="text-accent-2-800">
              積載装備のメモ
            </Label>
            <Input
              id="gearMemo"
              name="gearMemo"
              placeholder="例）リアキャリア＋40Lシートバッグ"
              className="focus-visible:border-accent-2-600"
              value={gearMemo}
              onChange={(event) => setGearMemo(event.target.value)}
            />
          </div>
        </div>
        <p
          className={cn(
            "mt-2 flex items-start gap-1.5 text-2xs leading-relaxed",
            hasProfileBike ? "text-accent-2-800" : "text-accent-700",
          )}
        >
          <Info strokeWidth={2.75} className="mt-0.5 size-3.5 shrink-0" />
          <span className="flex-1">
            {hasProfileBike
              ? "プロフィールの設定を初期値にしています。積載装備のメモはこのイベントだけ変更できます（車種はプロフィールに保存）。"
              : "プロフィールに車種が未登録です。入力した内容はプロフィールにも保存されます。"}
          </span>
        </p>
      </div>

      <FormError message={state.ok ? undefined : state.error} />

      {/* デザインでは「作成する」のほうが少し広い（1 : 1.4）。DialogFooter は子を全部 flex-1 にそろえるので使わない */}
      <div className="mt-2 flex gap-2">
        <DialogClose asChild>
          <Button type="button" variant="secondary" className="flex-1">
            キャンセル
          </Button>
        </DialogClose>
        <Button disabled={isPending} type="submit" className="flex-[1.4]">
          作成する
        </Button>
      </div>
    </form>
  );
}

export { CreateEventDialog };
