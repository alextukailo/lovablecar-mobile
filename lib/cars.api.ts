import { api } from './api';

export interface ApiCar {
  id: string;
  make: string;
  model: string;
  year: number;
  engine?: string | null;
  vin?: string | null;
  licensePlate?: string | null;
  mileage: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateCarInput = {
  make: string;
  model: string;
  year: number;
  engine?: string;
  vin?: string;
  licensePlate?: string;
  mileage: number;
  isPrimary?: boolean;
};

export type UpdateCarInput = Partial<CreateCarInput>;

export async function fetchCars(): Promise<ApiCar[]> {
  const response = await api.get<ApiCar[]>('/cars');
  return response.data;
}

export async function fetchCar(id: string): Promise<ApiCar> {
  const response = await api.get<ApiCar>(`/cars/${id}`);
  return response.data;
}

export async function createCar(
  data: CreateCarInput,
): Promise<ApiCar> {
  const response = await api.post<ApiCar>('/cars', data);
  return response.data;
}

export async function updateCarApi(
  id: string,
  data: UpdateCarInput,
): Promise<ApiCar> {
  const response = await api.patch<ApiCar>(
    `/cars/${id}`,
    data,
  );

  return response.data;
}

export async function deleteCarApi(id: string): Promise<void> {
  await api.delete(`/cars/${id}`);
}
