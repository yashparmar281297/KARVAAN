// Display type is wide (Archivo): ~0.9em per uppercase character, so the
// divisor below keeps a little margin. Capping the size by the column width
// (cqi — needs an `@container` ancestor) keeps the longest word on one line,
// so names never spill past their column.
export function fitFont(base: string, words: string[], padding = "0px") {
  const longest = Math.max(4, ...words.map((w) => w.length));
  return `min(${base}, calc((100cqi - ${padding}) / ${(longest * 0.92).toFixed(2)}))`;
}
