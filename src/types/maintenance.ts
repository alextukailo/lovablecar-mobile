export type MaintenanceStatus =
  | 'UPCOMING'
  | 'DUE'
  | 'OVERDUE';

export interface MaintenanceRule {
  id: string;
  vehicleId: string;
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
  lastServiceMileage?: number;
  lastServiceDate?: string;
  status: MaintenanceStatus;
}
