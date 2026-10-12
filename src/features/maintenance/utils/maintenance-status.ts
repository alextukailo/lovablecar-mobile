
import type { ApiMaintenanceSchedule } from '../../../../lib/maintenance.api';

export type CalculatedMaintenanceStatus =
  | 'DISABLED'
  | 'NOT_CONFIGURED'
  | 'UPCOMING'
  | 'DUE_SOON'
  | 'OVERDUE';

export interface MaintenanceStatusResult {
  status: CalculatedMaintenanceStatus;
  remainingKm: number | null;
  remainingDays: number | null;
  label: string;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function utcCalendarDay(date: Date): number {
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
}

function daysUntil(
  dueDate: string,
  now: Date,
): number | null {
  const parsed = new Date(dueDate);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const dueDay = utcCalendarDay(parsed);
  const currentDay = utcCalendarDay(now);

  return Math.round(
    (dueDay - currentDay) /
      MILLISECONDS_PER_DAY,
  );
}

export function calculateMaintenanceStatus(
  schedule: ApiMaintenanceSchedule,
  currentMileage: number,
  now: Date = new Date(),
): MaintenanceStatusResult {
  if (!schedule.enabled) {
    return {
      status: 'DISABLED',
      remainingKm: null,
      remainingDays: null,
      label: 'Disabled',
    };
  }

  const remainingKm =
    schedule.nextDueMileage !== null &&
    Number.isFinite(currentMileage)
      ? schedule.nextDueMileage - currentMileage
      : null;

  const remainingDays = schedule.nextDueDate
    ? daysUntil(schedule.nextDueDate, now)
    : null;

  if (
    remainingKm === null &&
    remainingDays === null
  ) {
    return {
      status: 'NOT_CONFIGURED',
      remainingKm,
      remainingDays,
      label: 'Not configured',
    };
  }

  const overdueByMileage =
    remainingKm !== null && remainingKm <= 0;

  const overdueByDate =
    remainingDays !== null && remainingDays <= 0;

  if (overdueByMileage || overdueByDate) {
    return {
      status: 'OVERDUE',
      remainingKm,
      remainingDays,
      label: 'Overdue',
    };
  }

  const dueSoonByMileage =
    remainingKm !== null &&
    remainingKm <= schedule.warningKm;

  const dueSoonByDate =
    remainingDays !== null &&
    remainingDays <= schedule.warningDays;

  if (dueSoonByMileage || dueSoonByDate) {
    return {
      status: 'DUE_SOON',
      remainingKm,
      remainingDays,
      label: 'Due soon',
    };
  }

  return {
    status: 'UPCOMING',
    remainingKm,
    remainingDays,
    label: 'Upcoming',
  };
}
