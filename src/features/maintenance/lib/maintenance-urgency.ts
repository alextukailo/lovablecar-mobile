
import type {
    MaintenanceOverviewResult,
} from '@/features/maintenance/lib/maintenance-overview';

export type MaintenanceUrgencyLevel =
  | 'OVERDUE'
  | 'DUE_SOON'
  | 'OK'
  | 'NOT_CONFIGURED'
  | 'DISABLED'
  | 'EMPTY';

export interface MaintenanceUrgencySummary {
  level: MaintenanceUrgencyLevel;
  label: string;
  count: number;
  needsAttention: boolean;
}

/**
 * Determine the most important maintenance state
 * from an already calculated overview.
 *
 * Priority:
 * 1. Overdue
 * 2. Due soon
 * 3. Upcoming / OK
 * 4. Not configured
 * 5. Disabled
 * 6. Empty
 *
 * This function performs no API requests
 * and does not modify its input.
 */
export function getMaintenanceUrgency(
  overview: MaintenanceOverviewResult,
): MaintenanceUrgencySummary {
  const { counts } = overview;

  if (counts.overdue > 0) {
    return {
      level: 'OVERDUE',
      label:
        counts.overdue === 1
          ? '1 overdue service'
          : `${counts.overdue} overdue services`,
      count: counts.overdue,
      needsAttention: true,
    };
  }

  if (counts.dueSoon > 0) {
    return {
      level: 'DUE_SOON',
      label:
        counts.dueSoon === 1
          ? '1 service due soon'
          : `${counts.dueSoon} services due soon`,
      count: counts.dueSoon,
      needsAttention: true,
    };
  }

  if (counts.configured > 0) {
    return {
      level: 'OK',
      label: 'Maintenance up to date',
      count: counts.configured,
      needsAttention: false,
    };
  }

  if (counts.unconfigured > 0) {
    return {
      level: 'NOT_CONFIGURED',
      label: 'Maintenance not configured',
      count: counts.unconfigured,
      needsAttention: false,
    };
  }

  if (
    counts.total > 0 &&
    counts.disabled === counts.total
  ) {
    return {
      level: 'DISABLED',
      label: 'Maintenance reminders disabled',
      count: counts.disabled,
      needsAttention: false,
    };
  }

  return {
    level: 'EMPTY',
    label: 'No maintenance schedules',
    count: 0,
    needsAttention: false,
  };
}
