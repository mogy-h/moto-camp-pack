import { describe, it, expect } from "vitest";
import { assertCan, assertOwner } from "@/lib/permissions";
import { ForbiddenError } from "@/lib/errors";

describe("assertCan: deleteItem", () => {
  const me = { id: "m1" };

  it("登録者は削除できる", () => {
    const item = { createdById: "m1", requesterId: null, carrierId: null };
    expect(() => assertCan("deleteItem", me, item)).not.toThrow();
  });

  it("借り手は、登録者でなくても削除できる", () => {
    const item = { createdById: "m2", requesterId: "m1", carrierId: null };
    expect(() => assertCan("deleteItem", me, item)).not.toThrow();
  });

  it("登録者でも借り手でもなければ ForbiddenError", () => {
    const item = { createdById: "m2", requesterId: null, carrierId: null };
    expect(() => assertCan("deleteItem", me, item)).toThrow(ForbiddenError);
  });
});

describe("assertCan: withdrawCarrier", () => {
  const me = { id: "m1" };

  it("担当本人は降りられる", () => {
    const item = { createdById: "m2", requesterId: null, carrierId: "m1" };
    expect(() => assertCan("withdrawCarrier", me, item)).not.toThrow();
  });
  it("ほかの人が担当なら降りられない", () => {
    const item = { createdById: "m2", requesterId: null, carrierId: "m2" };
    expect(() => assertCan("withdrawCarrier", me, item)).toThrow(
      ForbiddenError,
    );
  });
  it("担当者がいなければ降りられない", () => {
    const item = { createdById: "m2", requesterId: null, carrierId: null };
    expect(() => assertCan("withdrawCarrier", me, item)).toThrow(
      ForbiddenError,
    );
  });
});

describe("assertCan: togglePacked", () => {
  const me = { id: "m1" };

  it("担当本人は積み込み済みを切り替えられる", () => {
    const item = { createdById: "m2", requesterId: null, carrierId: "m1" };
    expect(() => assertCan("togglePacked", me, item)).not.toThrow();
  });
  it("ほかの人が担当なら切り替えられない", () => {
    const item = { createdById: "m2", requesterId: null, carrierId: "m2" };
    expect(() => assertCan("togglePacked", me, item)).toThrow(ForbiddenError);
  });
});

describe("assertCan: cancelRental", () => {
  const me = { id: "m1" };

  it("借り手本人は取り下げられる", () => {
    const item = { createdById: "m1", requesterId: "m1", carrierId: null };
    expect(() => assertCan("cancelRental", me, item)).not.toThrow();
  });
  it("ほかの人の募集は取り下げられない", () => {
    const item = { createdById: "m2", requesterId: "m2", carrierId: null };
    expect(() => assertCan("cancelRental", me, item)).toThrow(ForbiddenError);
  });
  it("貸す人（担当）でも取り下げられない", () => {
    const item = { createdById: "m2", requesterId: "m2", carrierId: "m1" };
    expect(() => assertCan("cancelRental", me, item)).toThrow(ForbiddenError);
  });
  it("共同装備の登録者は取り下げられない", () => {
    const item = { createdById: "m1", requesterId: null, carrierId: null };
    expect(() => assertCan("cancelRental", me, item)).toThrow(ForbiddenError);
  });
});

describe("assertOwner", () => {
  it("オーナーの場合、エラーにならない", () => {
    expect(() => assertOwner({ role: "OWNER" })).not.toThrow();
  });
  it("オーナーでない場合、ForbiddenError を投げる", () => {
    expect(() => assertOwner({ role: "MEMBER" })).toThrow(ForbiddenError);
  });
});
