
import { z } from 'zod';

const supportedCurrencies = [
  'BYN',
  'USD',
  'EUR',
  'PLN',
  'GBP',
  'RUB',
] as const;

export const serviceSchema = z.object({
  date: z
    .string()
    .trim()
    .min(1, 'Service date is required')
    .refine((value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const parsed = new Date(`${value}T00:00:00.000Z`);

      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    }, 'Enter a valid date in YYYY-MM-DD format'),

  mileage: z
    .string()
    .trim()
    .min(1, 'Mileage is required')
    .regex(/^\d+$/, 'Mileage must contain only digits')
    .refine(
      (value) => Number.isSafeInteger(Number(value)),
      'Enter a valid mileage',
    )
    .refine(
      (value) => Number(value) <= 10_000_000,
      'Mileage is too high',
    ),

  serviceName: z
    .string()
    .trim()
    .min(1, 'Service name is required')
    .max(150, 'Service name is too long'),

  totalCost: z
    .string()
    .trim()
    .min(1, 'Service cost is required')
    .regex(
      /^\d+(?:[.,]\d{1,2})?$/,
      'Enter a valid amount, e.g. 120 or 120.50',
    )
    .refine(
      (value) => {
        const amount = Number(value.replace(',', '.'));

        return Number.isFinite(amount) && amount >= 0;
      },
      'Cost cannot be negative',
    )
    .refine(
      (value) =>
        Number.isFinite(Number(value.replace(',', '.'))) &&
        Number(value.replace(',', '.')) <= 1_000_000_000,
      'Cost is too high',
    ),

  currency: z.enum(supportedCurrencies, {
    message: 'Select a supported currency',
  }),

  workshop: z
    .string()
    .trim()
    .max(150, 'Workshop name is too long'),
});

export type ServiceFormValues = z.infer<
  typeof serviceSchema
>;

export const supportedCurrencyOptions = supportedCurrencies.map(
  (currency) => ({
    label: currency,
    value: currency,
  }),
);

export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function createEmptyServiceFormValues(
  mileage = '',
): ServiceFormValues {
  return {
    date: getLocalDateString(),
    mileage,
    serviceName: '',
    totalCost: '',
    currency: 'BYN',
    workshop: '',
  };
}
