// Number formatting shared by the UI. Labels and sentences live in the i18n dictionaries.

/** 3 → "3", 1.5 → "1.5". Points are always whole or halves, so one decimal is enough. */
export function formatPoints(points: number): string {
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}
