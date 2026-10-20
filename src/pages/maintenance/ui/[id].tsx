
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

import type {
    ApiMaintenanceSchedule,
    CompleteMaintenanceInput,
    UpdateMaintenanceScheduleInput,
} from '@/../lib/maintenance.api';

import {
    useCompleteMaintenance,
    useMaintenanceSchedule,
    useUpdateMaintenanceSchedule,
} from '@/../lib/maintenance.queries';

import { useCar } from '@/features/cars/model/useCars';

const MAX_INTEGER = 2_147_483_647;

const maintenanceLabels: Record<string, string> = {
  ENGINE_OIL: 'Engine oil + filter',
  TRANSMISSION_OIL: 'Transmission oil',
  BRAKE_FLUID: 'Brake fluid',
  HALDEX_OIL: 'Haldex oil',
};

interface FormValues {
  enabled: boolean;
  intervalKm: string;
  intervalMonths: string;
  lastServiceMileage: string;
  lastServiceDate: string;
  warningKm: string;
  warningDays: string;
  notes: string;
}

interface CompletionValues {
  mileage: string;
  completedAt: string;
  notes: string;
}

type CompletionDetails = Omit<
  CompleteMaintenanceInput,
  'idempotencyKey'
>;

interface PendingCompletion {
  carId: string;
  scheduleId: string;
  data: CompleteMaintenanceInput;
}

/**
 * Create a sufficiently distinctive request identifier.
 *
 * This key is not an authentication credential.
 * It is used only to identify repeated writes.
 */
function createIdempotencyKey(): string {
  const randomPart = () =>
    Math.random().toString(36).slice(2);

  return [
    'maintenance',
    Date.now().toString(36),
    randomPart(),
    randomPart(),
  ].join('_');
}

/**
 * Format today's date using the device's local calendar.
 */
function getLocalToday(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getScheduleName(
  schedule: ApiMaintenanceSchedule,
): string {
  if (schedule.type === 'CUSTOM') {
    return schedule.customTitle || 'Custom maintenance';
  }

  return (
    maintenanceLabels[schedule.type] ||
    schedule.type.replace(/_/g, ' ')
  );
}

function getFormValues(
  schedule: ApiMaintenanceSchedule,
): FormValues {
  return {
    enabled: schedule.enabled,
    intervalKm:
      schedule.intervalKm === null
        ? ''
        : String(schedule.intervalKm),
    intervalMonths:
      schedule.intervalMonths === null
        ? ''
        : String(schedule.intervalMonths),
    lastServiceMileage:
      schedule.lastServiceMileage === null
        ? ''
        : String(schedule.lastServiceMileage),
    lastServiceDate: schedule.lastServiceDate
      ? schedule.lastServiceDate.slice(0, 10)
      : '',
    warningKm: String(schedule.warningKm),
    warningDays: String(schedule.warningDays),
    notes: schedule.notes ?? '',
  };
}

function parseInteger(
  value: string,
  label: string,
  allowEmpty: boolean,
): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    if (allowEmpty) return null;
    throw new Error(`${label} is required.`);
  }

  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`${label} must be a whole number.`);
  }

  const number = Number(trimmed);

  if (
    !Number.isSafeInteger(number) ||
    number > MAX_INTEGER
  ) {
    throw new Error(
      `${label} must not exceed ${MAX_INTEGER}.`,
    );
  }

  return number;
}

function parseDate(
  value: string,
  label: string,
  required: boolean,
): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    if (required) {
      throw new Error(`${label} is required.`);
    }

    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }

  const parsed = new Date(
    `${trimmed}T00:00:00.000Z`,
  );

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== trimmed
  ) {
    throw new Error(
      `${label} must be a valid calendar date.`,
    );
  }

  if (trimmed > getLocalToday()) {
    throw new Error(
      `${label} cannot be in the future.`,
    );
  }

  return parsed.toISOString();
}

function buildSchedulePayload(
  values: FormValues,
): UpdateMaintenanceScheduleInput {
  const intervalKm = parseInteger(
    values.intervalKm,
    'Kilometer interval',
    true,
  );

  const intervalMonths = parseInteger(
    values.intervalMonths,
    'Month interval',
    true,
  );

  const lastServiceMileage = parseInteger(
    values.lastServiceMileage,
    'Last service mileage',
    true,
  );

  const warningKm = parseInteger(
    values.warningKm,
    'Kilometer reminder threshold',
    false,
  );

  const warningDays = parseInteger(
    values.warningDays,
    'Day reminder threshold',
    false,
  );

  if (intervalKm !== null && intervalKm <= 0) {
    throw new Error(
      'Kilometer interval must be greater than zero.',
    );
  }

  if (intervalMonths !== null && intervalMonths <= 0) {
    throw new Error(
      'Month interval must be greater than zero.',
    );
  }

  if (
    values.enabled &&
    intervalKm === null &&
    intervalMonths === null
  ) {
    throw new Error(
      'An enabled reminder requires a kilometer or month interval.',
    );
  }

  if (warningKm === null || warningDays === null) {
    throw new Error(
      'Reminder thresholds are required.',
    );
  }

  if (values.notes.length > 5000) {
    throw new Error(
      'Notes cannot exceed 5000 characters.',
    );
  }

  return {
    enabled: values.enabled,
    intervalKm,
    intervalMonths,
    lastServiceMileage,
    lastServiceDate: parseDate(
      values.lastServiceDate,
      'Last service date',
      false,
    ),
    warningKm,
    warningDays,
    notes: values.notes.trim() || null,
  };
}

function buildCompletionDetails(
  values: CompletionValues,
): CompletionDetails {
  const mileage = parseInteger(
    values.mileage,
    'Completion mileage',
    false,
  );

  if (mileage === null) {
    throw new Error(
      'Completion mileage is required.',
    );
  }

  const completedAt = parseDate(
    values.completedAt,
    'Completion date',
    true,
  );

  if (completedAt === null) {
    throw new Error(
      'Completion date is required.',
    );
  }

  if (values.notes.length > 5000) {
    throw new Error(
      'Completion notes cannot exceed 5000 characters.',
    );
  }

  return {
    mileage,
    completedAt,
    notes: values.notes.trim() || null,
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'An unexpected error occurred.';
}

function sameCompletionDetails(
  first: CompletionDetails,
  second: CompletionDetails,
): boolean {
  return (
    first.mileage === second.mileage &&
    first.completedAt === second.completedAt &&
    (first.notes ?? null) === (second.notes ?? null)
  );
}

export default function EditMaintenanceScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    carId?: string | string[];
  }>();

  const scheduleId = firstParam(params.id);
  const carId = firstParam(params.carId);

  const {
    data: schedule,
    isLoading: scheduleLoading,
    isError: scheduleError,
    error: scheduleErrorDetails,
    refetch: refetchSchedule,
  } = useMaintenanceSchedule(carId, scheduleId);

  const {
    data: car,
    isLoading: carLoading,
    isError: carError,
    refetch: refetchCar,
  } = useCar(carId);

  const updateMutation = useUpdateMaintenanceSchedule();
  const completeMutation = useCompleteMaintenance();

  const [values, setValues] =
    useState<FormValues | null>(null);

  const [completion, setCompletion] =
    useState<CompletionValues>({
      mileage: '',
      completedAt: getLocalToday(),
      notes: '',
    });

  /**
   * Keep the pending request and its key when
   * the network fails or the user retries.
   */
  const pendingCompletionRef =
    useRef<PendingCompletion | null>(null);

  /**
   * Prevent repeated taps while confirmation
   * or a request is already in progress.
   */
  const completionLockedRef = useRef(false);

  useEffect(() => {
    if (schedule) {
      setValues(getFormValues(schedule));
    }
  }, [schedule]);

  useEffect(() => {
    if (car && schedule) {
      setCompletion({
        mileage: String(car.mileage),
        completedAt: getLocalToday(),
        notes: '',
      });

      pendingCompletionRef.current = null;
      completionLockedRef.current = false;
    }
  }, [car?.id, schedule?.id]);

  const updateField = (
    field: keyof FormValues,
    value: string | boolean,
  ) => {
    setValues((current) =>
      current
        ? { ...current, [field]: value }
        : current,
    );
  };

  const updateCompletionField = (
    field: keyof CompletionValues,
    value: string,
  ) => {
    setCompletion((current) => ({
      ...current,
      [field]: value,
    }));

    /**
     * Do not discard a pending key automatically.
     *
     * If a request timed out, it might already have
     * succeeded on the server. Reusing the original
     * key is essential to avoiding duplicates.
     *
     * A changed payload is checked before retrying.
     */
  };

  const backToCar = () => {
    if (!carId) {
      router.replace('/(tabs)/cars');
      return;
    }

    router.replace({
      pathname: '/car/[id]',
      params: { id: carId },
    });
  };

  const isBusy =
    updateMutation.isPending ||
    completeMutation.isPending;

  const handleSave = async () => {
    if (
      !carId ||
      !scheduleId ||
      !schedule ||
      !values ||
      isBusy ||
      completionLockedRef.current
    ) {
      return;
    }

    let payload: UpdateMaintenanceScheduleInput;

    try {
      payload = buildSchedulePayload(values);
    } catch (error) {
      Alert.alert(
        'Invalid maintenance settings',
        getErrorMessage(error),
      );
      return;
    }

    try {
      await updateMutation.mutateAsync({
        carId,
        scheduleId,
        data: payload,
      });

      backToCar();
    } catch (error) {
      Alert.alert(
        'Could not save maintenance',
        getErrorMessage(error),
      );
    }
  };

  const handleComplete = () => {
    if (
      !carId ||
      !scheduleId ||
      !schedule ||
      !car ||
      isBusy ||
      completionLockedRef.current
    ) {
      return;
    }

    let details: CompletionDetails;

    try {
      details = buildCompletionDetails(completion);
    } catch (error) {
      Alert.alert(
        'Invalid completion details',
        getErrorMessage(error),
      );
      return;
    }

    if (details.mileage > car.mileage) {
      Alert.alert(
        'Mileage check',
        'The completion mileage is higher than the car’s current recorded mileage. Update the car mileage first, or correct the completion mileage.',
      );
      return;
    }

    const pending = pendingCompletionRef.current;

    if (
      pending &&
      (
        pending.carId !== carId ||
        pending.scheduleId !== scheduleId ||
        !sameCompletionDetails(
          pending.data,
          details,
        )
      )
    ) {
      Alert.alert(
        'Previous completion needs checking',
        'A previous completion request may have reached the server. To avoid duplicate service records, return to the car and check service history before submitting different completion details.',
      );
      return;
    }

    const payload: CompleteMaintenanceInput =
      pending?.data ?? {
        ...details,
        idempotencyKey: createIdempotencyKey(),
      };

    const maintenanceName = getScheduleName(schedule);
    const completedDate = payload.completedAt.slice(0, 10);
    const completedMileage = payload.mileage;

    completionLockedRef.current = true;

    Alert.alert(
      'Confirm maintenance completion',
      `Record "${maintenanceName}" as completed on ${completedDate} at ${completedMileage.toLocaleString('en-GB')} km?\n\nThis will create a new service-history record and recalculate the next maintenance deadline.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            completionLockedRef.current = false;
          },
        },
        {
          text: 'Mark as completed',
          onPress: () => {
            /**
             * Retain the exact request before sending.
             * If the response is lost, the next attempt
             * will reuse this key and payload.
             */
            pendingCompletionRef.current = {
              carId,
              scheduleId,
              data: payload,
            };

            void (async () => {
              try {
                await completeMutation.mutateAsync({
                  carId,
                  scheduleId,
                  data: payload,
                });

                pendingCompletionRef.current = null;
                backToCar();
              } catch (error) {
                Alert.alert(
                  'Could not confirm completion',
                  `${getErrorMessage(error)}\n\nThe request may have succeeded. Retry with the same details and this screen will reuse the original request key. Do not create a separate service record until you have checked the result.`,
                );
              } finally {
                completionLockedRef.current = false;
              }
            })();
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          if (!completeMutation.isPending) {
            completionLockedRef.current = false;
          }
        },
      },
    );
  };

  if (!carId || !scheduleId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>
          Missing maintenance information
        </Text>
        <Text style={styles.description}>
          Open a maintenance schedule from your car details screen.
        </Text>
        <Pressable onPress={backToCar}>
          <Text style={styles.link}>Back to cars</Text>
        </Pressable>
      </View>
    );
  }

  if (scheduleLoading || carLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#246BFD" />
        <Text style={styles.description}>
          Loading maintenance settings...
        </Text>
      </View>
    );
  }

  if (scheduleError || carError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>
          Could not load maintenance
        </Text>
        <Text style={styles.description}>
          {scheduleErrorDetails instanceof Error
            ? scheduleErrorDetails.message
            : 'Please check your backend connection.'}
        </Text>
        <Pressable
          onPress={() => {
            void refetchSchedule();
            void refetchCar();
          }}
        >
          <Text style={styles.link}>Try again</Text>
        </Pressable>
        <Pressable onPress={backToCar}>
          <Text style={styles.link}>Back to car</Text>
        </Pressable>
      </View>
    );
  }

  if (!schedule || !car || !values) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>
          Maintenance schedule unavailable
        </Text>
        <Pressable onPress={backToCar}>
          <Text style={styles.link}>Back to car</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={backToCar}
          style={styles.backButton}
        >
          <Text style={styles.link}>‹ Back to car</Text>
        </Pressable>

        <Text style={styles.title}>Edit maintenance</Text>
        <Text style={styles.description}>
          {car.make} {car.model} · {car.year}
        </Text>
        <Text style={styles.scheduleTitle}>
          {getScheduleName(schedule)}
        </Text>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.fieldLabel}>
                Maintenance reminder
              </Text>
              <Text style={styles.fieldHint}>
                Enable or disable this schedule.
              </Text>
            </View>
            <Switch
              value={values.enabled}
              onValueChange={(enabled) =>
                updateField('enabled', enabled)
              }
              trackColor={{
                false: '#D6DAE1',
                true: '#A9C4FF',
              }}
              thumbColor={
                values.enabled ? '#246BFD' : '#FFFFFF'
              }
              disabled={isBusy}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          SERVICE INTERVAL
        </Text>

        <View style={styles.card}>
          <FormField
            label="Every (km)"
            value={values.intervalKm}
            onChangeText={(value) =>
              updateField('intervalKm', value)
            }
            placeholder="e.g. 15000"
            keyboardType="number-pad"
            hint="Leave blank if not applicable."
          />
          <FormField
            label="Every (months)"
            value={values.intervalMonths}
            onChangeText={(value) =>
              updateField('intervalMonths', value)
            }
            placeholder="e.g. 12"
            keyboardType="number-pad"
            hint="Leave blank if not applicable."
          />
        </View>

        <Text style={styles.sectionTitle}>
          LAST COMPLETED MAINTENANCE
        </Text>

        <View style={styles.card}>
          <FormField
            label="Mileage (km)"
            value={values.lastServiceMileage}
            onChangeText={(value) =>
              updateField('lastServiceMileage', value)
            }
            placeholder="e.g. 120000"
            keyboardType="number-pad"
            hint="Leave blank if unknown."
          />
          <FormField
            label="Date"
            value={values.lastServiceDate}
            onChangeText={(value) =>
              updateField('lastServiceDate', value)
            }
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            hint="Leave blank if unknown."
          />
        </View>

        <Text style={styles.sectionTitle}>
          REMINDER THRESHOLDS
        </Text>

        <View style={styles.card}>
          <FormField
            label="Warn before (km)"
            value={values.warningKm}
            onChangeText={(value) =>
              updateField('warningKm', value)
            }
            placeholder="e.g. 1000"
            keyboardType="number-pad"
          />
          <FormField
            label="Warn before (days)"
            value={values.warningDays}
            onChangeText={(value) =>
              updateField('warningDays', value)
            }
            placeholder="e.g. 30"
            keyboardType="number-pad"
          />
        </View>

        <Text style={styles.sectionTitle}>NOTES</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.notesInput}
            value={values.notes}
            onChangeText={(value) =>
              updateField('notes', value)
            }
            placeholder="Optional maintenance notes"
            placeholderTextColor="#A0A6B0"
            multiline
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.disclaimer}>
          Maintenance intervals are configurable.
          Verify the correct schedule for your
          vehicle before enabling reminders.
        </Text>

        <Pressable
          style={[
            styles.saveButton,
            isBusy && styles.disabledButton,
          ]}
          onPress={() => void handleSave()}
          disabled={isBusy}
        >
          <Text style={styles.saveButtonText}>
            {updateMutation.isPending
              ? 'Saving changes...'
              : 'Save changes'}
          </Text>
        </Pressable>

        <Text style={styles.sectionTitle}>
          RECORD COMPLETED SERVICE
        </Text>

        <View style={styles.card}>
          <Text style={styles.completionDescription}>
            Use this section only after the
            maintenance has actually been performed.
            A new entry will be added to your
            service history.
          </Text>

          <FormField
            label="Completed at mileage (km)"
            value={completion.mileage}
            onChangeText={(value) =>
              updateCompletionField('mileage', value)
            }
            placeholder="e.g. 128500"
            keyboardType="number-pad"
            hint="Defaults to the car's recorded mileage."
          />

          <FormField
            label="Completion date"
            value={completion.completedAt}
            onChangeText={(value) =>
              updateCompletionField('completedAt', value)
            }
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={styles.fieldLabel}>
            Service notes (optional)
          </Text>

          <TextInput
            style={styles.notesInput}
            value={completion.notes}
            onChangeText={(value) =>
              updateCompletionField('notes', value)
            }
            placeholder="What was performed?"
            placeholderTextColor="#A0A6B0"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.completionHint}>
            Completion creates a new service record
            and resets this schedule's next due
            mileage and date. Unsaved changes to
            the schedule settings above will not
            be included.
          </Text>

          <Pressable
            style={[
              styles.completeButton,
              isBusy && styles.disabledButton,
            ]}
            onPress={handleComplete}
            disabled={isBusy}
          >
            <Text style={styles.completeButtonText}>
              {completeMutation.isPending
                ? 'Recording completion...'
                : 'Mark as completed'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType:
    | 'number-pad'
    | 'numbers-and-punctuation';
  hint?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A0A6B0"
        keyboardType={keyboardType}
        autoCorrect={false}
      />
      {hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6F8',
    padding: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  title: {
    color: '#252A34',
    fontSize: 26,
    fontWeight: '800',
  },
  description: {
    color: '#737B89',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  scheduleTitle: {
    color: '#252A34',
    fontSize: 19,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#737B89',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  switchText: {
    flex: 1,
  },
  field: {
    marginBottom: 18,
  },
  fieldLabel: {
    color: '#252A34',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  fieldHint: {
    color: '#737B89',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#252A34',
    fontSize: 15,
  },
  notesInput: {
    backgroundColor: '#F5F6F8',
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    color: '#252A34',
    fontSize: 15,
  },
  disclaimer: {
    color: '#737B89',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 18,
    marginBottom: 18,
  },
  saveButton: {
    backgroundColor: '#246BFD',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  completionDescription: {
    color: '#737B89',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  completionHint: {
    color: '#737B89',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 16,
    marginBottom: 18,
  },
  completeButton: {
    backgroundColor: '#276749',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  link: {
    color: '#246BFD',
    fontWeight: '700',
    marginTop: 8,
  },
});
