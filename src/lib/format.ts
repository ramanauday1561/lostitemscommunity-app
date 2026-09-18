/**
 * Display formatting. These were each written two to four times across the
 * screens, in slightly different ways - initials four times, the en-GB date
 * four times, the money format twice - so a change of mind about any of
 * them meant finding every copy.
 */

/** "Ada Lovelace" -> "AL". Falls back rather than rendering an empty circle. */
export function initials(...candidates: (string | null | undefined)[]): string {
  const name = candidates.find((c) => !!c && c.trim().length > 0)?.trim();
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** 12450 -> "$12,450". Whole dollars: the prototype shows no cents. */
export function money(amount: number): string {
  return `$${Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/** "11 Jun 2024" */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "Jun 2024" - used where only the joining month matters. */
export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}
