import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LIMITS } from "@/lib/validation/limits";

// LIMITS と prisma/schema.prisma の @db.VarChar(n) がずれていないかを確かめる
const schema = readFileSync(new URL("../../../prisma/schema.prisma", import.meta.url), "utf8");

// "Model.field" → n
const varcharColumns = new Map<string, number>();
for (const [, model, body] of schema.matchAll(/^model (\w+) \{([\s\S]*?)^\}/gm)) {
  for (const [, field, length] of body.matchAll(/^\s*(\w+)\s+String\??\s.*@db\.VarChar\((\d+)\)/gm)) {
    varcharColumns.set(`${model}.${field}`, Number(length));
  }
}

const expected: Record<string, number> = {
  "User.displayName": LIMITS.displayName,
  "User.bike": LIMITS.bike,
  "User.gearMemo": LIMITS.gearMemo,
  "EventMember.gearMemo": LIMITS.gearMemo,
  "Event.title": LIMITS.eventTitle,
  "Event.place": LIMITS.eventPlace,
  "Item.name": LIMITS.gearName,
  "LendableGear.name": LIMITS.gearName,
};

describe("LIMITS と DB の varchar(n)", () => {
  it.each(Object.entries(expected))("%s の上限が一致する", (column, limit) => {
    expect(varcharColumns.get(column)).toBe(limit);
  });

  it("varchar の列がすべて LIMITS と対応付けられている（列を足したら LIMITS にも足す）", () => {
    expect([...varcharColumns.keys()].sort()).toEqual(Object.keys(expected).sort());
  });
});
