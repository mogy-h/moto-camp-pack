export type ItemStatus = "fixed" | "asking" | "unassigned" | "open";

export function itemStatus(item: {
  kind: "SHARED" | "RENTAL";
  carrierId: string | null;
  acceptedAt: Date | null;
}): ItemStatus {
  switch (item.kind) {
    case "RENTAL":
      if (item.carrierId && item.acceptedAt) return "fixed";
      if (item.carrierId) return "asking";
      return "open";
    case "SHARED":
      if (item.carrierId) return "fixed";
      return "unassigned";
  }
}
