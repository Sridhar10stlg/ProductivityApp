// Count-based duplicate detection for imports.
//
// A row is a duplicate only as often as the database already holds an identical one: if the file has
// three identical rows and the database already has two, one is added. That keeps genuine repeats
// (two identical coffees on the same day) while making re-importing the same file add nothing.
export function splitNewAndDuplicate<T>(
  candidates: T[],
  existingKeys: string[],
  keyOf: (item: T) => string
): { fresh: T[]; duplicates: number } {
  const remaining = new Map<string, number>();
  for (const key of existingKeys) remaining.set(key, (remaining.get(key) ?? 0) + 1);

  const fresh: T[] = [];
  let duplicates = 0;
  for (const item of candidates) {
    const key = keyOf(item);
    const left = remaining.get(key) ?? 0;
    if (left > 0) {
      remaining.set(key, left - 1);
      duplicates++;
    } else {
      fresh.push(item);
    }
  }
  return { fresh, duplicates };
}

export const normText = (v: string | null | undefined) => (v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
