
import type {
    MaintenanceUrgencyLevel,
} from './maintenance-urgency';

import type {
    CalculatedMaintenanceStatus,
} from './maintenance-status';

export interface MaintenanceStatusColors {
  background: string;
  text: string;
  border: string;
}

/**
 * Shared colors for maintenance status indicators.
 *
 * OVERDUE        Red
 * DUE_SOON       Amber
 * UPCOMING / OK  Green
 * NOT_CONFIGURED Gray
 * DISABLED       Gray
 * EMPTY          Gray
 */
export const MAINTENANCE_COLORS = {
  overdue: {
    background: '#FDE8E8',
    text: '#B91C1C',
    border: '#F5B5B5',
  },

  dueSoon: {
    background: '#FFF3D6',
    text: '#9A6700',
    border: '#F4D28A',
  },

  ok: {
    background: '#E6F4EA',
    text: '#276749',
    border: '#A9D8B5',
  },

  neutral: {
    background: '#F1F1F1',
    text: '#737373',
    border: '#D4D4D4',
  },
} as const satisfies Record<
  string,
  MaintenanceStatusColors
>;

/**
 * Colors for a calculated individual schedule status.
 */
export function getMaintenanceStatusColors(
  status: CalculatedMaintenanceStatus,
): MaintenanceStatusColors {
  switch (status) {
    case 'OVERDUE':
      return MAINTENANCE_COLORS.overdue;

    case 'DUE_SOON':
      return MAINTENANCE_COLORS.dueSoon;

    case 'UPCOMING':
      return MAINTENANCE_COLORS.ok;

    case 'NOT_CONFIGURED':
    case 'DISABLED':
    default:
      return MAINTENANCE_COLORS.neutral;
  }
}

/**
 * Colors for the overall maintenance urgency
 * of a vehicle.
 */
export function getMaintenanceUrgencyColors(
  level: MaintenanceUrgencyLevel,
): MaintenanceStatusColors {
  switch (level) {
    case 'OVERDUE':
      return MAINTENANCE_COLORS.overdue;

    case 'DUE_SOON':
      return MAINTENANCE_COLORS.dueSoon;

    case 'OK':
      return MAINTENANCE_COLORS.ok;

    case 'NOT_CONFIGURED':
    case 'DISABLED':
    case 'EMPTY':
    default:
      return MAINTENANCE_COLORS.neutral;
  }
}
