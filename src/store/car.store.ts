import { create } from 'zustand';

export interface LocalCar {
  id: string;
  make: string;
  model: string;
  year: number;
  engine?: string;
  vin?: string;
  licensePlate?: string;
  mileage: number;
  isPrimary: boolean;
}

interface CarStore {
  cars: LocalCar[];
  selectedCarId: string | null;

  addCar: (
    car: Omit<LocalCar, 'id'>,
  ) => void;

  updateCar: (
    id: string,
    updates: Partial<LocalCar>,
  ) => void;

  selectCar: (id: string) => void;

  removeCar: (id: string) => void;
}

export const useCarStore = create<CarStore>((set) => ({
  cars: [
    {
      id: 'car-1',
      make: 'Volkswagen',
      model: 'Tiguan',
      year: 2017,
      engine: '2.0 TSI',
      mileage: 128450,
      isPrimary: true,
    },
  ],

  selectedCarId: 'car-1',

  addCar: (car) =>
    set((state) => {
      const newCar: LocalCar = {
        ...car,
        id: `car-${Date.now()}`,
      };

      return {
        cars: [...state.cars, newCar],
        selectedCarId: newCar.id,
      };
    }),

  updateCar: (id, updates) =>
    set((state) => ({
      cars: state.cars.map((car) =>
        car.id === id
          ? { ...car, ...updates }
          : car,
      ),
    })),

  selectCar: (id) =>
    set({
      selectedCarId: id,
    }),

  removeCar: (id) =>
    set((state) => {
      const cars = state.cars.filter(
        (car) => car.id !== id,
      );

      return {
        cars,
        selectedCarId:
          state.selectedCarId === id
            ? cars[0]?.id ?? null
            : state.selectedCarId,
      };
    }),
}));
