
import { StyleSheet, Text, View } from 'react-native';

import type {
    CalculatedMaintenanceStatus,
} from '@/features/maintenance/lib/maintenance-status';

import type {
    MaintenanceUrgencyLevel,
} from '@/features/maintenance/lib/maintenance-urgency';

import {
    getMaintenanceStatusColors,
    getMaintenanceUrgencyColors,
} from '@/features/maintenance/lib/maintenance-theme';

type BadgeStatus =
  | CalculatedMaintenanceStatus
  | MaintenanceUrgencyLevel;

interface MaintenanceStatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  count?: number;
  compact?: boolean;
}

function getDefaultLabel(
  status: BadgeStatus,
): string {
  switch (status) {
    case 'OVERDUE':
      return 'Overdue';

    case 'DUE_SOON':
      return 'Due soon';

    case 'UPCOMING':
      return 'Upcoming';

    case 'OK':
      return 'Up to date';

    case 'NOT_CONFIGURED':
      return 'Not configured';

    case 'DISABLED':
      return 'Disabled';

    case 'EMPTY':
      return 'No schedules';

    default:
      return 'Maintenance';
  }
}

function getBadgeColors(status: BadgeStatus) {
  if (
    status === 'OK' ||
    status === 'EMPTY'
  ) {
    return getMaintenanceUrgencyColors(status);
  }

  return getMaintenanceStatusColors(status);
}

/**
 * Shared maintenance status badge.
 *
 * Can represent either:
 * - an individual maintenance schedule, or
 * - the overall urgency of a car.
 *
 * Examples:
 *
 * <MaintenanceStatusBadge status="OVERDUE" />
 *
 * <MaintenanceStatusBadge
 *   status="DUE_SOON"
 *   count={2}
 * />
 *
 * <MaintenanceStatusBadge
 *   status="OK"
 *   compact
 * />
 */
export default function MaintenanceStatusBadge({
  status,
  label,
  count,
  compact = false,
}: MaintenanceStatusBadgeProps) {
  const colors = getBadgeColors(status);

  const text = label ?? getDefaultLabel(status);

  const countPrefix =
    count !== undefined && count > 0
      ? `${count} `
      : '';

  return (
    <View
      style={[
        styles.badge,
        compact && styles.compactBadge,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          compact && styles.compactText,
          {
            color: colors.text,
          },
        ]}
      >
        {countPrefix}
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  compactBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },

  text: {
    fontSize: 11,
    fontWeight: '700',
  },

  compactText: {
    fontSize: 10,
  },
});
