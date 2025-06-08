export function isOverlap(
  aStart: Date,
  aEnd: Date | null,
  bStart?: Date,
  bEnd?: Date
): boolean {
  const aEndSafe = aEnd ?? new Date("9999-12-31");
  if (bStart && aEndSafe < bStart) return false;
  if (bEnd && aStart > bEnd) return false;
  return true;
}
