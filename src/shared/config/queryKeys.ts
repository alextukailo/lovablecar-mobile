/** Centralized query-key factories for gradual React Query migration. */
export const queryKeys = {
  cars: ['cars'] as const,
  car: (id: string) => ['cars', id] as const,
  services: (carId: string) => ['services', carId] as const,
  service: (id: string) => ['service', id] as const,
  maintenance: (carId: string) => ['maintenance', carId] as const,
};
