export function updateReputation(
  oldR: number,
  V: number,
  alpha = 0.1
): number {
  return (1 - alpha) * oldR + alpha * (V / 100);
}
