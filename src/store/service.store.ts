import { create } from 'zustand';

export interface LocalServiceRecord {
  id: string;
  vehicleId: string;

  date: string;
  mileage: number;
  serviceName: string;
  totalCost: number;
  currency: string;

  workshop?: string;
  documentUri?: string;

  createdAt: string;
}

interface ServiceStore {
  services: LocalServiceRecord[];

  addService: (
    service: Omit<
      LocalServiceRecord,
      'id' | 'createdAt'
    >,
  ) => void;

  removeService: (id: string) => void;
}

export const useServiceStore = create<ServiceStore>(
  (set) => ({
    services: [],

    addService: (service) =>
      set((state) => ({
        services: [
          {
            ...service,
            id: `service-${Date.now()}`,
            createdAt: new Date().toISOString(),
          },
          ...state.services,
        ],
      })),

    removeService: (id) =>
      set((state) => ({
        services: state.services.filter(
          (service) => service.id !== id,
        ),
      })),
  }),
);
