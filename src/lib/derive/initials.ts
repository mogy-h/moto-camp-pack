const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });

export function initials(name: string): string {
  const cleaned = name.normalize("NFC").replace(/\s/g, "");
  const characters = Array.from(
    segmenter.segment(cleaned),
    (segment) => segment.segment,
  );
  return characters.slice(0, 2).join("");
}
