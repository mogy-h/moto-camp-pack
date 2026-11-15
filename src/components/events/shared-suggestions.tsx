"use client";

import { useActionState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { SizeChip } from "@/components/events/item-parts";
import { addSharedItem } from "@/actions/items";
import type { SuggestionsData } from "@/actions/suggestions";
import type { ActionResult } from "@/lib/action-result";
import type { Suggestion } from "@/lib/validation/schemas";
import { excludeExisting } from "@/lib/suggest/exclude-existing";
import { MAX_SUGGESTIONS } from "@/lib/suggest/prompt";

// 共同装備の提案（#47）。見出しのボタンと、見出しの下に出す候補の一覧。
// ボタンと一覧は離れた場所に置くので、結果（useActionState）は共通の親の EventBoard で持ち、両方に渡す

type SuggestButtonProps = {
  eventId: string;
  formAction: (formData: FormData) => void; // EventBoard の useActionState が返す formAction
  isPending: boolean;
};

// 見出しの「足りないものを提案」ボタン。押すと suggestSharedItems が呼ばれる
function SuggestButton({ eventId, formAction, isPending }: SuggestButtonProps) {
  return (
    <form action={formAction} className="flex shrink-0">
      <input type="hidden" name="eventId" value={eventId} />
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        disabled={isPending}
        className="text-xs"
      >
        <Sparkles strokeWidth={2.75} className="size-3.5" />
        {isPending ? "考え中…" : "足りないものを提案"}
      </Button>
    </form>
  );
}

type SuggestionPanelProps = {
  eventId: string;
  result: ActionResult<SuggestionsData>; // suggestSharedItems の戻り値
  registeredNames: string[]; // 登録済みの共同装備の名前（絞り込みに関係なく全部）
};

// 見出しの下に出す候補の一覧
function SuggestionPanel({
  eventId,
  result,
  registeredNames,
}: SuggestionPanelProps) {
  // 回数制限などで失敗したときは、メッセージだけ出す
  if (!result.ok) {
    return <FormError message={result.error} className="mb-2.25" />;
  }

  // 「追加」が成功すると revalidatePath で registeredNames に名前が増えるので、追加した候補は一覧から自然に消える
  const candidates = result.data.suggestions;

  const visible: Suggestion[] = excludeExisting(
    candidates,
    registeredNames,
    MAX_SUGGESTIONS,
  );

  return (
    <section
      aria-label="共同装備の提案"
      className="mb-2.25 rounded-lg bg-surface px-3.25 py-3"
    >
      <h3 className="flex items-center gap-1.5 text-xs font-bold text-neutral-800">
        <Sparkles
          strokeWidth={2.75}
          className="size-3.5 text-accent"
          aria-hidden
        />
        {result.data.source === "ai" ? "AI の提案" : "定番の共同装備"}
      </h3>
      {result.data.source === "preset" && (
        <p className="mt-1 text-2xs leading-relaxed text-neutral-700">
          AI の提案を取得できなかったため、定番のリストから表示しています
        </p>
      )}

      {visible.length > 0 ? (
        <ul className="mt-2.25 flex flex-col gap-1.5">
          {visible.map((suggestion) => (
            <SuggestionRow
              key={suggestion.name}
              eventId={eventId}
              suggestion={suggestion}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-2.25 text-center text-xs text-neutral-700">
          追加できる候補はありません
        </p>
      )}
    </section>
  );
}

const initialState: ActionResult = { ok: true, data: undefined };

// 候補の1行。「追加」で addSharedItem を呼び、共同装備として登録する（手で追加したときと同じ検証・通知になる）
function SuggestionRow({
  eventId,
  suggestion,
}: {
  eventId: string;
  suggestion: Suggestion;
}) {
  // 成功すると revalidatePath で registeredNames が増え、この行は一覧から消える（SuggestionPanel の excludeExisting）
  const [, formAction, isPending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await addSharedItem(prev, formData);
      if (result.ok) toast.success(`${suggestion.name}を追加しました`);
      if (!result.ok) toast.error(result.error);
      return result;
    },
    initialState,
  );

  return (
    <li className="flex items-center gap-2.25 rounded-md border-2 border-dashed border-neutral-300 bg-neutral-100 py-1.5 pr-1.75 pl-3.25">
      <span className="min-w-0 flex-auto text-sm leading-snug font-semibold text-pretty wrap-anywhere text-text">
        {suggestion.name}
      </span>
      <SizeChip size={suggestion.size} />
      <form action={formAction} className="flex shrink-0">
        {/* addSharedItem が formData.get で読む名前（eventId / name / size）にそろえる。
            書き換えられても、addSharedItem が手入力のときと同じように検証する */}
        <input type="hidden" name="eventId" value={eventId} />
        <input type="hidden" name="name" value={suggestion.name} />
        <input type="hidden" name="size" value={suggestion.size} />
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          aria-label={`${suggestion.name}を共同装備に追加`}
          className="bg-accent-200 text-xs text-accent-800 shadow-none hover:bg-accent-300"
        >
          <Plus strokeWidth={2.75} className="size-3.5" />
          追加
        </Button>
      </form>
    </li>
  );
}

export { SuggestButton, SuggestionPanel };
