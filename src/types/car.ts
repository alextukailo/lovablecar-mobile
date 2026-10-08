export interface Car {
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
