// src/utils/jaccard.ts
export function jaccard(a: string, b: string): number {
  const A = new Set(a.split(' '));
  const B = new Set(b.split(' '));
  const intersection = new Set([...A].filter(x => B.has(x)));
  return intersection.size / (A.size + B.size - intersection.size);
}
