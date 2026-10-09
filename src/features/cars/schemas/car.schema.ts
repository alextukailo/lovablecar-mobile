
import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const carSchema = z.object({
  make: z
    .string()
    .trim()
    .min(1, 'Make is required')
    .max(100, 'Make is too long'),

  model: z
    .string()
    .trim()
    .min(1, 'Model is required')
    .max(100, 'Model is too long'),

  year: z
    .string()
    .trim()
    .min(1, 'Year is required')
    .regex(/^\d{4}$/, 'Enter a valid year')
    .refine(
      (value) => {
        const year = Number(value);
        return year >= 1900 && year <= currentYear + 1;
      },
      'Year must be between 1900 and next year',
    ),

  engine: z
    .string()
    .trim()
    .max(100, 'Engine description is too long'),

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

  vin: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine(
      (value) =>
        value === '' ||
        /^[A-HJ-NPR-Z0-9]{17}$/.test(value),
      'VIN must contain 17 valid characters',
    ),

  licensePlate: z
    .string()
    .trim()
    .max(20, 'License plate is too long'),
});

export type CarFormValues = z.infer<typeof carSchema>;

export const emptyCarFormValues: CarFormValues = {
  make: '',
  model: '',
  year: '',
  engine: '',
  mileage: '',
  vin: '',
  licensePlate: '',
};
