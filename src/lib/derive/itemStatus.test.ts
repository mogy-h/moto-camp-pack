import { describe, it, expect } from "vitest";
import { itemStatus } from "@/lib/derive/itemStatus";

describe("itemStatus", () => {
  it("貸し借り装備で、担当が運搬する承認をした場合 fixed", () => {
    const item = {
      kind: "RENTAL" as const,
      carrierId: "m1",
      acceptedAt: new Date(),
    };
    expect(itemStatus(item)).toBe("fixed");
  });
  it("貸し借り装備で、担当が指定されているが未承認の場合 asking", () => {
    const item = {
      kind: "RENTAL" as const,
      carrierId: "m1",
      acceptedAt: null,
    };
    expect(itemStatus(item)).toBe("asking");
  });
  it("貸し借り装備で、担当を指定せず、まだ誰も請け負っていない場合 open", () => {
    const item = {
      kind: "RENTAL" as const,
      carrierId: null,
      acceptedAt: null,
    };
    expect(itemStatus(item)).toBe("open");
  });
  it("共同装備で、担当が決まっていれば fixed", () => {
    const item = {
      kind: "SHARED" as const,
      carrierId: "m1",
      acceptedAt: new Date(),
    };
    expect(itemStatus(item)).toBe("fixed");
  });
  it("共同装備で、担当が決まっていない場合 unassigned", () => {
    const item = {
      kind: "SHARED" as const,
      carrierId: null,
      acceptedAt: null,
    };
    expect(itemStatus(item)).toBe("unassigned");
  });
});
