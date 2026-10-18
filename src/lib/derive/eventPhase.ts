import { toDateString } from "@/lib/date";

export function eventPhase(
  event: {
    status: "DRAFT" | "PUBLISHED";
    endDate: Date;
  },
  today: string,
): "done" | "draft" | "upcoming" {
  const endDateYmd = toDateString(event.endDate);
  if (endDateYmd < today) return "done";
  if (event.status === "DRAFT") return "draft";
  return "upcoming";
}
