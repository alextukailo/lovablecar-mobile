
import type {
    ApiMaintenanceSchedule,
} from '../../../../lib/maintenance.api';

import {
    calculateMaintenanceStatus,
} from './maintenance-status';

import type {
    MaintenanceStatusResult,
} from './maintenance-status';

export interface NextMaintenanceItem {
  schedule: ApiMaintenanceSchedule;
  result: MaintenanceStatusResult;
}

function statusPriority(
  status: MaintenanceStatusResult['status'],
): number {
  switch (status) {
    case 'OVERDUE':
      return 0;

    case 'DUE_SOON':
      return 1;

    case 'UPCOMING':
      return 2;

    default:
      return 3;
  }
}

/**
 * Calculates the closest deadline as a fraction of
 * its warning threshold.
 *
 * Values:
 *   < 0  = overdue
 *   0    = due now
 *   1    = at the warning threshold
 *   > 1  = outside the warning threshold
 *
 * Mileage and date are evaluated independently.
 * The most urgent dimension wins.
 */
function urgencyScore(
  item: NextMaintenanceItem,
): number {
  const { schedule, result } = item;

  const scores: number[] = [];

  if (result.remainingKm !== null) {
    if (schedule.warningKm > 0) {
      scores.push(
        result.remainingKm / schedule.warningKm,
      );
    } else {
      scores.push(result.remainingKm);
    }
  }

  if (result.remainingDays !== null) {
    if (schedule.warningDays > 0) {
      scores.push(
        result.remainingDays / schedule.warningDays,
      );
    } else {
      scores.push(result.remainingDays);
    }
  }

  if (scores.length === 0) {
    return Infinity;
  }

  return Math.min(...scores);
}

function compareItems(
  a: NextMaintenanceItem,
  b: NextMaintenanceItem,
): number {
  const priorityDifference =
    statusPriority(a.result.status) -
    statusPriority(b.result.status);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  const urgencyDifference =
    urgencyScore(a) - urgencyScore(b);

  if (urgencyDifference !== 0) {
    return urgencyDifference;
  }

  return a.schedule.id.localeCompare(b.schedule.id);
}

/**
 * Returns the most urgent configured and enabled
 * maintenance schedule for a vehicle.
 *
 * Disabled and unconfigured schedules are excluded.
 *
 * Does not mutate the schedules array.
 */
export function findNextMaintenance(
  schedules: ApiMaintenanceSchedule[],
  currentMileage: number,
  now: Date = new Date(),
): NextMaintenanceItem | null {
  const candidates: NextMaintenanceItem[] = [];

  for (const schedule of schedules) {
    const result = calculateMaintenanceStatus(
      schedule,
      currentMileage,
      now,
    );

    if (
      result.status === 'DISABLED' ||
      result.status === 'NOT_CONFIGURED'
    ) {
      continue;
    }

    candidates.push({
      schedule,
      result,
    });
  }

  candidates.sort(compareItems);

  return candidates[0] ?? null;
}
