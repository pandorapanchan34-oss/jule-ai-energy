export function calculateJule(
  V: number,
  dH_prime: number,
  R: number,
  k: number,
  sigma: number,
  phi: number,
  A: number
): number {
  const tanh = Math.tanh(V / 50);
  return tanh * dH_prime * R * k * sigma * phi * A * 100;
}
