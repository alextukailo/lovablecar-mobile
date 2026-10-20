
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    useReminders,
    type ReminderInput,
} from '../../../entities/reminder';

import { useEditReminderAction } from '../../../features/edit-reminder';
import { ReminderForm } from '../../../features/reminder-form';

const COLORS = {
  navy: '#102647',
  blue: '#41668B',
  sky: '#EAF6FF',
  white: '#FFFFFF',
};

export default function EditReminderPage() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: reminders,
    isLoading,
    isError,
    refetch,
  } = useReminders();

  const {
    update,
    isSaving,
  } = useEditReminderAction();

  const reminder = reminders?.find(
    (item) => item.id === id,
  );

  async function handleSubmit(
    input: ReminderInput,
  ): Promise<void> {
    if (!id) {
      throw new Error('Reminder ID is missing.');
    }

    await update(id, input);

    router.back();
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={COLORS.blue}
        />
        <Text style={styles.message}>
          Loading reminder...
        </Text>
      </View>
    );
  }

  if (isError || !reminder) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={52}
          color={COLORS.blue}
        />

        <Text style={styles.title}>
          {isError
            ? 'Unable to load reminder'
            : 'Reminder not found'}
        </Text>

        <Text style={styles.message}>
          {isError
            ? 'Please check your connection and try again.'
            : 'This reminder may have been deleted.'}
        </Text>

        {isError && (
          <Pressable
            style={styles.button}
            onPress={() => void refetch()}
          >
            <Text style={styles.buttonText}>
              Try again
            </Text>
          </Pressable>
        )}

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  const initialDate = new Date(reminder.scheduledAt);

  return (
    <ReminderForm
      key={reminder.id}
      mode="edit"
      initialText={reminder.text}
      initialDate={
        Number.isNaN(initialDate.getTime())
          ? undefined
          : initialDate
      }
      saving={isSaving}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: COLORS.sky,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 14,
  },
  title: {
    color: COLORS.navy,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: COLORS.blue,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  button: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  backButton: {
    padding: 12,
  },
  backText: {
    color: COLORS.blue,
    fontSize: 14,
    fontWeight: '700',
  },
});
