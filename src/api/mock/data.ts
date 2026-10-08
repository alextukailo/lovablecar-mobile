import { Car } from '@/types/car';
import { ServiceRecord } from '@/types/service';

export const cars: Car[] = [
  {
    id: 'car-1',
    make: 'Volkswagen',
    model: 'Tiguan',
    year: 2017,
    engine: '2.0 TSI',
    mileage: 128450,
    isPrimary: true,
  },
];

export const services: ServiceRecord[] = [
  {
    id: 'service-1',
    vehicleId: 'car-1',
    date: '2026-10-08',
    mileage: 128450,
    serviceName: 'Engine oil change',
    totalCost: 420,
    currency: 'BYN',
    items: [
      {
        id: 'item-1',
        type: 'PART',
        name: 'Engine oil',
        quantity: 5,
        price: 350,
      },
      {
        id: 'item-2',
        type: 'PART',
        name: 'Oil filter',
        quantity: 1,
        price: 70,
      },
    ],
  },
  {
    id: 'service-2',
    vehicleId: 'car-1',
    date: '2026-07-12',
    mileage: 125900,
    serviceName: 'Diagnostics',
    totalCost: 80,
    currency: 'BYN',
    items: [],
  },
];
