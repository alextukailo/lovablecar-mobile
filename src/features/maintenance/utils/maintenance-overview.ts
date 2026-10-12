
import type {
    ApiMaintenanceSchedule,
} from '../../../../lib/maintenance.api';

import {
    calculateMaintenanceStatus,
} from './maintenance-status';

import type {
    CalculatedMaintenanceStatus,
} from './maintenance-status';

export interface MaintenanceOverview {
  total: number;
  enabled: number;
  disabled: number;
  configured: number;
  unconfigured: number;
  overdue: number;
  dueSoon: number;
  upcoming: number;
}

export interface MaintenanceOverviewItem {
  schedule: ApiMaintenanceSchedule;
  status: CalculatedMaintenanceStatus;
  remainingKm: number | null;
  remainingDays: number | null;
}

export interface MaintenanceOverviewResult {
  counts: MaintenanceOverview;
  items: MaintenanceOverviewItem[];
}

/**
 * Build a maintenance overview for one car.
 *
 * Statuses are calculated from the car's current
 * mileage and the supplied reference date.
 *
 * No API requests or database writes are performed.
 */
export function calculateMaintenanceOverview(
  schedules: readonly ApiMaintenanceSchedule[],
  currentMileage: number,
  now: Date = new Date(),
): MaintenanceOverviewResult {
  const counts: MaintenanceOverview = {
    total: 0,
    enabled: 0,
    disabled: 0,
    configured: 0,
    unconfigured: 0,
    overdue: 0,
    dueSoon: 0,
    upcoming: 0,
  };

  const items: MaintenanceOverviewItem[] = [];

  for (const schedule of schedules) {
    const result = calculateMaintenanceStatus(
      schedule,
      currentMileage,
      now,
    );

    counts.total += 1;

    if (result.status === 'DISABLED') {
      counts.disabled += 1;
    } else {
      counts.enabled += 1;

      switch (result.status) {
        case 'NOT_CONFIGURED':
          counts.unconfigured += 1;
          break;

        case 'OVERDUE':
          counts.configured += 1;
          counts.overdue += 1;
          break;

        case 'DUE_SOON':
          counts.configured += 1;
          counts.dueSoon += 1;
          break;

        case 'UPCOMING':
          counts.configured += 1;
          counts.upcoming += 1;
          break;
      }
    }

    items.push({
      schedule,
      status: result.status,
      remainingKm: result.remainingKm,
      remainingDays: result.remainingDays,
    });
  }

  return {
    counts,
    items,
  };
}

/**
 * True when at least one enabled maintenance
 * schedule needs attention.
 */
export function hasMaintenanceWarnings(
  overview: MaintenanceOverviewResult,
): boolean {
  return (
    overview.counts.overdue > 0 ||
    overview.counts.dueSoon > 0
  );
}

/**
 * Return a short summary for car cards.
 */
export function getMaintenanceOverviewLabel(
  overview: MaintenanceOverviewResult,
): string {
  const { counts } = overview;

  if (counts.overdue > 0) {
    return counts.overdue === 1
      ? '1 overdue service'
      : `${counts.overdue} overdue services`;
  }

  if (counts.dueSoon > 0) {
    return counts.dueSoon === 1
      ? '1 service due soon'
      : `${counts.dueSoon} services due soon`;
  }

  if (counts.configured > 0) {
    return 'Maintenance up to date';
  }

  if (counts.unconfigured > 0) {
    return 'Maintenance not configured';
  }

  if (counts.total > 0 && counts.disabled === counts.total) {
    return 'Maintenance reminders disabled';
  }

  return 'No maintenance schedules';
}
