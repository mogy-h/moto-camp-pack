export function progress(items: { packedAt: Date | null }[]): {
  packed: number;
  total: number;
  ratio: number;
} {
  const total = items.length;
  const packed = items.filter((item) => item.packedAt !== null).length;
  const ratio = total ? packed / total : 0;

  return { total, packed, ratio };
}
