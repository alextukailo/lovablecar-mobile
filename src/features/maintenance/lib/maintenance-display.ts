
import type {
    ApiMaintenanceSchedule,
} from '@/../lib/maintenance.api';

import type {
    MaintenanceStatusResult,
} from '@/features/maintenance/lib/maintenance-status';

/**
 * Human-readable maintenance names.
 *
 * Custom titles are taken from the saved schedule.
 */
export function getMaintenanceName(
  schedule: ApiMaintenanceSchedule,
): string {
  switch (schedule.type) {
    case 'ENGINE_OIL':
      return 'Engine oil';

    case 'TRANSMISSION_OIL':
      return 'Transmission oil';

    case 'BRAKE_FLUID':
      return 'Brake fluid';

    case 'HALDEX_OIL':
      return 'Haldex oil';

    case 'CUSTOM':
      return (
        schedule.customTitle?.trim() ||
        'Custom maintenance'
      );

    default:
      return (
        schedule.customTitle?.trim() ||
        'Maintenance'
      );
  }
}

/**
 * Format kilometers using a stable locale.
 */
export function formatMaintenanceKm(
  kilometers: number,
): string {
  return `${Math.round(kilometers).toLocaleString(
    'en-GB',
  )} km`;
}

/**
 * Describe the remaining mileage.
 */
export function formatRemainingKm(
  remainingKm: number | null,
): string | null {
  if (
    remainingKm === null ||
    !Number.isFinite(remainingKm)
  ) {
    return null;
  }

  if (remainingKm < 0) {
    return `${formatMaintenanceKm(
      Math.abs(remainingKm),
    )} overdue`;
  }

  if (remainingKm === 0) {
    return 'Mileage due now';
  }

  return `${formatMaintenanceKm(
    remainingKm,
  )} remaining`;
}

/**
 * Describe the remaining calendar days.
 */
export function formatRemainingDays(
  remainingDays: number | null,
): string | null {
  if (
    remainingDays === null ||
    !Number.isFinite(remainingDays)
  ) {
    return null;
  }

  const days = Math.abs(
    Math.round(remainingDays),
  );

  const unit =
    days === 1 ? 'day' : 'days';

  if (remainingDays < 0) {
    return `${days} ${unit} overdue`;
  }

  if (remainingDays === 0) {
    return 'Date due today';
  }

  return `${days} ${unit} remaining`;
}

/**
 * Combine the available mileage and calendar
 * deadlines into one readable line.
 *
 * This uses the status result already calculated
 * by calculateMaintenanceStatus().
 */
export function formatMaintenanceDeadline(
  result: MaintenanceStatusResult,
): string {
  const mileage = formatRemainingKm(
    result.remainingKm,
  );

  const days = formatRemainingDays(
    result.remainingDays,
  );

  const parts = [mileage, days].filter(
    (value): value is string =>
      value !== null,
  );

  if (parts.length === 0) {
    return 'No due date configured';
  }

  return parts.join(' · ');
}

/**
 * Return a short label suitable for a badge.
 */
export function getMaintenanceStatusLabel(
  result: MaintenanceStatusResult,
): string {
  switch (result.status) {
    case 'OVERDUE':
      return 'Overdue';

    case 'DUE_SOON':
      return 'Due soon';

    case 'UPCOMING':
      return 'Upcoming';

    case 'NOT_CONFIGURED':
      return 'Not configured';

    case 'DISABLED':
      return 'Disabled';

    default:
      return result.label;
  }
}
