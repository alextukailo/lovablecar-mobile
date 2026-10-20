/** Shared, side-effect-free display helpers. */
export function formatMileage(value: number, locale = 'en-US'): string {
  return `${new Intl.NumberFormat(locale).format(value)} km`;
}
export function formatMoney(value: number, currency = 'PLN', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
