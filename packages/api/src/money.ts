/**
 * Money handling.
 *
 * All monetary values are stored and computed as integer cents so that
 * arithmetic is exact — binary floating-point can't represent values like
 * 0.1 + 0.2 precisely, which silently loses fractions of a cent across
 * escrow holds, releases, refunds, and payout math. Convert to a
 * human-facing decimal string only at the display boundary with formatCents.
 */

/**
 * Parse a price string into integer cents.
 * Accepts shapes like "$1,200.50", "500", or "1200.5" and returns 120050,
 * 50000, and 120050 respectively. Returns NaN when no number can be parsed.
 */
export function parsePriceToCents(price: string): number {
  const numeric = Number(String(price).replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(numeric)) {
    return Number.NaN;
  }

  return Math.round(numeric * 100);
}

/**
 * Format integer cents as a two-decimal string without a currency symbol,
 * e.g. 50000 -> "500.00". Callers add the "$" so existing `$${...}` markup
 * keeps working unchanged.
 */
export function formatCents(cents: number): string {
  return (Math.round(cents) / 100).toFixed(2);
}
