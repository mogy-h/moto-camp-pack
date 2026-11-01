import { describe, it, expect } from "vitest";
import { assertCan } from "@/lib/permissions";
import { ForbiddenError } from "@/lib/errors";

describe("assertCan: deleteItem", () => {
  const me = { id: "m1" };

  it("登録者は削除できる", () => {
    const item = { createdById: "m1", requesterId: null };
    expect(() => assertCan("deleteItem", me, item)).not.toThrow();
  });

  it("借り手は、登録者でなくても削除できる", () => {
    const item = { createdById: "m2", requesterId: "m1" };
    expect(() => assertCan("deleteItem", me, item)).not.toThrow();
  });

  it("登録者でも借り手でもなければ ForbiddenError", () => {
    const item = { createdById: "m2", requesterId: null };
    expect(() => assertCan("deleteItem", me, item)).toThrow(ForbiddenError);
  });
});
