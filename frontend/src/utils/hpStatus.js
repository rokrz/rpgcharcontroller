export function hpStatus(hp, max) {
  if (!max) return "healthy";
  const ratio = hp / max;
  if (ratio > 0.6) return "healthy";
  if (ratio > 0.3) return "wounded";
  return "critical";
}
