
import { api } from './api';

export type MaintenanceType =
  | 'ENGINE_OIL'
  | 'TRANSMISSION_OIL'
  | 'BRAKE_FLUID'
  | 'HALDEX_OIL'
  | 'CUSTOM'
  | (string & {});

export interface ApiMaintenanceSchedule {
  id: string;
  carId: string;
  type: MaintenanceType;
  customTitle: string | null;
  enabled: boolean;
  intervalKm: number | null;
  intervalMonths: number | null;
  lastServiceMileage: number | null;
  lastServiceDate: string | null;
  nextDueMileage: number | null;
  sourceServiceRecordId?: string | null;
  nextDueDate: string | null;
  warningKm: number;
  warningDays: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SaveMaintenanceScheduleInput = {
  type: MaintenanceType;
  customTitle?: string | null;
  enabled?: boolean;
  intervalKm?: number | null;
  intervalMonths?: number | null;
  lastServiceMileage?: number | null;
  lastServiceDate?: string | null;
  warningKm?: number;
  warningDays?: number;
  notes?: string | null;
};

export type UpdateMaintenanceScheduleInput =
  Partial<SaveMaintenanceScheduleInput>;

/**
 * Input accepted by:
 * POST /cars/:carId/maintenance/:id/complete
 *
 * completedAt supports YYYY-MM-DD or an ISO UTC string.
 *
 * idempotencyKey identifies one logical completion request.
 * The same key must be reused when retrying that request.
 *
 * Accepted key format:
 * - 8 to 128 characters
 * - Letters, numbers, underscores, and hyphens only
 */
export interface CompleteMaintenanceInput {
  mileage: number;
  completedAt: string;
  notes?: string | null;
  idempotencyKey: string;
}

/**
 * The ServiceRecord created by the completion endpoint.
 */
export interface ApiCompletedServiceRecord {
  id: string;
  carId: string;
  date: string;
  mileage: number;
  title: string;
  description: string | null;
  cost: string | null;
  currency: string;
  workshop: string | null;
  legacyLocalId: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Link between the maintenance schedule
 * and its associated service record.
 */
export interface ApiMaintenanceCompletion {
  id: string;
  maintenanceScheduleId: string;
  serviceRecordId: string;
  idempotencyKey: string | null;
  createdAt: string;
}

/**
 * Response returned by the backend complete() method.
 */
export interface CompleteMaintenanceResponse {
  completion: ApiMaintenanceCompletion;
  serviceRecord: ApiCompletedServiceRecord;
  schedule: ApiMaintenanceSchedule;
}

function maintenanceUrl(carId: string): string {
  return `/cars/${encodeURIComponent(carId)}/maintenance`;
}

function maintenanceScheduleUrl(
  carId: string,
  scheduleId: string,
): string {
  return `${maintenanceUrl(carId)}/${encodeURIComponent(
    scheduleId,
  )}`;
}

export async function fetchMaintenanceSchedules(
  carId: string,
): Promise<ApiMaintenanceSchedule[]> {
  const response = await api.get<ApiMaintenanceSchedule[]>(
    maintenanceUrl(carId),
  );

  return response.data;
}

export async function fetchMaintenanceSchedule(
  carId: string,
  scheduleId: string,
): Promise<ApiMaintenanceSchedule> {
  const response = await api.get<ApiMaintenanceSchedule>(
    maintenanceScheduleUrl(carId, scheduleId),
  );

  return response.data;
}

/**
 * Creates a schedule or updates an existing standard
 * maintenance schedule with the same carId and type.
 *
 * CUSTOM schedules are created separately by the backend.
 */
export async function saveMaintenanceSchedule(
  carId: string,
  data: SaveMaintenanceScheduleInput,
): Promise<ApiMaintenanceSchedule> {
  const response = await api.post<ApiMaintenanceSchedule>(
    maintenanceUrl(carId),
    data,
  );

  return response.data;
}

export async function updateMaintenanceSchedule(
  carId: string,
  scheduleId: string,
  data: UpdateMaintenanceScheduleInput,
): Promise<ApiMaintenanceSchedule> {
  const response = await api.patch<ApiMaintenanceSchedule>(
    maintenanceScheduleUrl(carId, scheduleId),
    data,
  );

  return response.data;
}

export async function deleteMaintenanceSchedule(
  carId: string,
  scheduleId: string,
): Promise<void> {
  await api.delete(
    maintenanceScheduleUrl(carId, scheduleId),
  );
}

/**
 * Marks a maintenance schedule as completed.
 *
 * The backend transaction:
 * 1. Creates a new ServiceRecord.
 * 2. Creates a MaintenanceCompletion link.
 * 3. Updates the maintenance schedule's last-service
 *    mileage and date.
 * 4. Recalculates the next due mileage and date.
 *
 * If the same idempotencyKey is submitted again with
 * identical completion details, the backend returns
 * the original completion instead of creating another.
 *
 * IMPORTANT:
 * Generate the key in the UI before the first request.
 * Reuse that exact key for retries.
 * Do not generate a new key inside this API function.
 *
 * This function performs a real database write.
 * Only call it after explicit user confirmation.
 */
export async function completeMaintenance(
  carId: string,
  scheduleId: string,
  data: CompleteMaintenanceInput,
): Promise<CompleteMaintenanceResponse> {
  const response =
    await api.post<CompleteMaintenanceResponse>(
      `${maintenanceScheduleUrl(
        carId,
        scheduleId,
      )}/complete`,
      data,
    );

  return response.data;
}
