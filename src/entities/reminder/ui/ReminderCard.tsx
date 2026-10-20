
import { Ionicons } from '@expo/vector-icons';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import type { CustomReminder } from '../model/types';

type Props = {
  reminder: CustomReminder;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

const C = {
  navy: '#102647',
  blue: '#41668B',
  white: '#FFFFFF',
  border: '#DFE9F2',
  muted: '#8194A7',
  yellow: '#FFD33F',
  green: '#16835D',
  red: '#C74343',
};

export default function ReminderCard({
  reminder,
  onEdit,
  onDelete,
  deleting = false,
}: Props) {
  const scheduled = new Date(reminder.scheduledAt);
  const validDate = !Number.isNaN(scheduled.getTime());

  const isPast = validDate && scheduled.getTime() < Date.now();

  const status = reminder.status;

  const statusLabel =
    status === 'SENT'
      ? 'Sent'
      : status === 'FAILED'
        ? 'Failed'
        : status === 'SENDING'
          ? 'Sending'
          : isPast
            ? 'Overdue'
            : 'Scheduled';

  const statusColor =
    status === 'SENT'
      ? C.green
      : status === 'FAILED' || isPast
        ? C.red
        : C.blue;

  const canEdit = status === 'PENDING';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <Ionicons
            name="notifications-outline"
            size={22}
            color={C.navy}
          />
        </View>

        <View style={styles.main}>
          <Text style={styles.message}>
            {reminder.text}
          </Text>

          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={C.blue}
            />
            <Text style={styles.dateText}>
              {validDate
                ? scheduled.toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Unknown date'}
            </Text>

            <Ionicons
              name="time-outline"
              size={15}
              color={C.blue}
            />
            <Text style={styles.dateText}>
              {validDate
                ? scheduled.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '--:--'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${statusColor}15` },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: statusColor },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: statusColor },
            ]}
          >
            {statusLabel}
          </Text>
        </View>

        <View style={styles.actions}>
          {canEdit && (
            <Pressable
              style={styles.actionButton}
              onPress={onEdit}
              disabled={deleting}
              accessibilityLabel="Edit reminder"
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={C.blue}
              />
            </Pressable>
          )}

          <Pressable
            style={styles.actionButton}
            onPress={onDelete}
            disabled={deleting}
            accessibilityLabel="Delete reminder"
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={C.red}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 13,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
  },
  message: {
    color: C.navy,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  dateText: {
    color: C.blue,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 7,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 16,
    paddingTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
