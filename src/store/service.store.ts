import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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

export type NewServiceRecord = Omit<
  LocalServiceRecord,
  'id' | 'createdAt'
>;

export type ServiceUpdates = Partial<
  Omit<LocalServiceRecord, 'id' | 'createdAt'>
>;

interface ServiceStore {
  services: LocalServiceRecord[];

  addService: (service: NewServiceRecord) => void;
  updateService: (id: string, updates: ServiceUpdates) => void;
  removeService: (id: string) => void;
  removeServicesForVehicle: (vehicleId: string) => void;
}

export const useServiceStore = create<ServiceStore>()(
  persist(
    (set) => ({
      services: [],

      addService: (service) =>
        set((state) => ({
          services: [
            {
              ...service,
              id: `service-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,
              createdAt: new Date().toISOString(),
            },
            ...state.services,
          ],
        })),

      updateService: (id, updates) =>
        set((state) => ({
          services: state.services.map((service) =>
            service.id === id
              ? {
                  ...service,
                  ...updates,
                  id: service.id,
                  createdAt: service.createdAt,
                }
              : service,
          ),
        })),

      removeService: (id) =>
        set((state) => ({
          services: state.services.filter(
            (service) => service.id !== id,
          ),
        })),

      removeServicesForVehicle: (vehicleId) =>
        set((state) => ({
          services: state.services.filter(
            (service) => service.vehicleId !== vehicleId,
          ),
        })),
    }),
    {
      name: 'lovablecar-services-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        services: state.services,
      }),
    },
  ),
);
