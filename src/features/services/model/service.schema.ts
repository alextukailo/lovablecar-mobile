
import { z } from 'zod';

const supportedCurrencies = [
  'BYN',
  'USD',
  'EUR',
  'PLN',
  'GBP',
  'RUB',
] as const;

export type ServiceValidationMessageKey =
  | 'dateRequired'
  | 'dateInvalid'
  | 'mileageRequired'
  | 'mileageDigits'
  | 'mileageInvalid'
  | 'mileageTooHigh'
  | 'serviceRequired'
  | 'serviceTooLong'
  | 'costRequired'
  | 'costInvalid'
  | 'costNegative'
  | 'costTooHigh'
  | 'currencyInvalid'
  | 'workshopTooLong';

type TranslateValidation = (
  key: ServiceValidationMessageKey,
) => string;

const englishValidation: Record<
  ServiceValidationMessageKey,
  string
> = {
  dateRequired: 'Service date is required',
  dateInvalid: 'Enter a valid date in YYYY-MM-DD format',
  mileageRequired: 'Mileage is required',
  mileageDigits: 'Mileage must contain only digits',
  mileageInvalid: 'Enter a valid mileage',
  mileageTooHigh: 'Mileage is too high',
  serviceRequired: 'Service name is required',
  serviceTooLong: 'Service name is too long',
  costRequired: 'Service cost is required',
  costInvalid: 'Enter a valid amount, e.g. 120 or 120.50',
  costNegative: 'Cost cannot be negative',
  costTooHigh: 'Cost is too high',
  currencyInvalid: 'Select a supported currency',
  workshopTooLong: 'Workshop name is too long',
};

const defaultTranslate: TranslateValidation = (key) =>
  englishValidation[key];

export function createServiceSchema(
  translate: TranslateValidation = defaultTranslate,
) {
  return z.object({
    date: z
      .string()
      .trim()
      .min(1, translate('dateRequired'))
      .refine((value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return false;
        }

        const parsed = new Date(
          `${value}T00:00:00.000Z`,
        );

        return (
          !Number.isNaN(parsed.getTime()) &&
          parsed.toISOString().slice(0, 10) === value
        );
      }, translate('dateInvalid')),

    mileage: z
      .string()
      .trim()
      .min(1, translate('mileageRequired'))
      .regex(
        /^\d+$/,
        translate('mileageDigits'),
      )
      .refine(
        (value) =>
          Number.isSafeInteger(Number(value)),
        translate('mileageInvalid'),
      )
      .refine(
        (value) => Number(value) <= 10_000_000,
        translate('mileageTooHigh'),
      ),

    serviceName: z
      .string()
      .trim()
      .min(1, translate('serviceRequired'))
      .max(150, translate('serviceTooLong')),

    totalCost: z
      .string()
      .trim()
      .min(1, translate('costRequired'))
      .regex(
        /^\d+(?:[.,]\d{1,2})?$/,
        translate('costInvalid'),
      )
      .refine((value) => {
        const amount = Number(
          value.replace(',', '.'),
        );

        return (
          Number.isFinite(amount) &&
          amount >= 0
        );
      }, translate('costNegative'))
      .refine(
        (value) => {
          const amount = Number(
            value.replace(',', '.'),
          );

          return (
            Number.isFinite(amount) &&
            amount <= 1_000_000_000
          );
        },
        translate('costTooHigh'),
      ),

    currency: z.enum(supportedCurrencies, {
      message: translate('currencyInvalid'),
    }),

    workshop: z
      .string()
      .trim()
      .max(150, translate('workshopTooLong')),
  });
}

// Retain the original export for other code
// that already imports serviceSchema.
export const serviceSchema = createServiceSchema();

export type ServiceFormValues = z.infer<
  typeof serviceSchema
>;

export const supportedCurrencyOptions =
  supportedCurrencies.map((currency) => ({
    label: currency,
    value: currency,
  }));

export function getLocalDateString(): string {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    now.getDate(),
  ).padStart(2, '0');

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
