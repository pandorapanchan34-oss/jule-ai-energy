export function calculateSigma(
  current: string,
  history: string[]
): number {
  if (history.length === 0) return 1;

  const similarity = history
    .map(h => jaccard(current, h))
    .reduce((a, b) => a + b, 0) / history.length;

  return 1 - similarity;
}

function jaccard(a: string, b: string): number {
  const A = new Set(a.split(" "));
  const B = new Set(b.split(" "));
  const intersection = new Set([...A].filter(x => B.has(x)));
  return intersection.size / (A.size + B.size - intersection.size);
}
