import { describe, expect, it } from "vitest";
import { eventPhase } from "@/lib/derive/eventPhase";
import { fromDateString } from "@/lib/date";

describe("eventPhase", () => {
  it("帰着日の当日は準備中", () => {
    const event = {
      status: "PUBLISHED" as const,
      endDate: fromDateString("2026-10-25"),
    };
    expect(eventPhase(event, "2026-10-25")).toBe("upcoming");
  });

  it("帰着日の翌日は完了", () => {
    const event = {
      status: "PUBLISHED" as const,
      endDate: fromDateString("2026-10-25"),
    };
    expect(eventPhase(event, "2026-10-26")).toBe("done");
  });

  it("帰着日より前の下書きは下書き", () => {
    const event = {
      status: "DRAFT" as const,
      endDate: fromDateString("2026-10-25"),
    };
    expect(eventPhase(event, "2026-10-24")).toBe("draft");
  });

  it("下書きのまま帰着日を過ぎたら完了", () => {
    const event = {
      status: "DRAFT" as const,
      endDate: fromDateString("2026-10-25"),
    };
    expect(eventPhase(event, "2026-10-26")).toBe("done");
  });
});
