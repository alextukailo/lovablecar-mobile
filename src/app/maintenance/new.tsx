
import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Bell,
    Check,
    ChevronDown,
    Gauge,
    Info,
    Save,
    Wrench
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
    MaintenanceType,
    SaveMaintenanceScheduleInput,
} from '../../../lib/maintenance.api';
import {
    useCarMaintenanceSchedules,
    useSaveMaintenanceSchedule,
} from '../../../lib/maintenance.queries';
import { useCar } from '../../features/cars/hooks/useCars';

const C = {
  navy: '#102C4B',
  blue: '#1689DC',
  muted: '#7892AA',
  sky: '#EAF6FF',
  background: '#F6FAFD',
  white: '#FFFFFF',
  yellow: '#FFD23F',
  border: '#E2ECF5',
  green: '#218C83',
  red: '#D64B4B',
};

const MAX_INTEGER = 2147483647;

const TYPES: {
  type: MaintenanceType;
  label: string;
  description: string;
}[] = [
  {
    type: 'ENGINE_OIL',
    label: 'Engine oil & filter',
    description: 'Oil and engine oil filter replacement',
  },
  {
    type: 'TRANSMISSION_OIL',
    label: 'Transmission oil',
    description: 'Transmission fluid maintenance',
  },
  {
    type: 'BRAKE_FLUID',
    label: 'Brake fluid',
    description: 'Brake hydraulic fluid replacement',
  },
  {
    type: 'HALDEX_OIL',
    label: 'Haldex oil',
    description: 'All-wheel-drive coupling maintenance',
  },
];

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'number-pad',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'number-pad' | 'default';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A5B8C9"
        keyboardType={keyboardType}
        autoCorrect={false}
      />
    </View>
  );
}

function parseOptionalNumber(
  value: string,
): number | null | undefined {
  if (!value.trim()) return null;

  const parsed = Number(value.trim());

  if (
    !Number.isInteger(parsed) ||
    parsed < 0 ||
    parsed > MAX_INTEGER
  ) {
    return undefined;
  }

  return parsed;
}

function parseDate(
  value: string,
): string | null | undefined {
  const input = value.trim();

  if (!input) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return undefined;
  }

  const [year, month, day] = input
    .split('-')
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return input;
}

export default function NewMaintenanceScreen() {
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    carId?: string;
  }>();

  const carId =
    typeof params.carId === 'string'
      ? params.carId
      : '';

  const { data: car } = useCar(carId);

  const {
    data: schedules = [],
    isLoading: schedulesLoading,
    isError: schedulesError,
  } = useCarMaintenanceSchedules(carId);

  const saveSchedule = useSaveMaintenanceSchedule();

  const [selectedType, setSelectedType] =
    useState<MaintenanceType>('ENGINE_OIL');

  const [typePickerOpen, setTypePickerOpen] =
    useState(false);

  const [enabled, setEnabled] = useState(true);

  const [intervalKm, setIntervalKm] = useState('');
  const [intervalMonths, setIntervalMonths] =
    useState('');

  const [
    lastServiceMileage,
    setLastServiceMileage,
  ] = useState('');

  const [
    lastServiceDate,
    setLastServiceDate,
  ] = useState('');

  const [warningKm, setWarningKm] =
    useState('500');

  const [warningDays, setWarningDays] =
    useState('14');

  const [notes, setNotes] = useState('');

  const existingSchedule = schedules.find(
    (item) => item.type === selectedType,
  );

  useEffect(() => {
    if (schedulesLoading) return;

    const existing = schedules.find(
      (item) => item.type === selectedType,
    );

    setEnabled(existing?.enabled ?? true);

    setIntervalKm(
      existing?.intervalKm?.toString() ?? '',
    );

    setIntervalMonths(
      existing?.intervalMonths?.toString() ?? '',
    );

    setLastServiceMileage(
      existing?.lastServiceMileage?.toString() ?? '',
    );

    setLastServiceDate(
      existing?.lastServiceDate
        ? existing.lastServiceDate.slice(0, 10)
        : '',
    );

    setWarningKm(
      existing?.warningKm?.toString() ?? '500',
    );

    setWarningDays(
      existing?.warningDays?.toString() ?? '14',
    );

    setNotes(existing?.notes ?? '');
  }, [selectedType, schedules, schedulesLoading]);

  const selectedLabel =
    TYPES.find((item) => item.type === selectedType)
      ?.label ?? 'Maintenance';

  const parsedIntervalKm =
    parseOptionalNumber(intervalKm);

  const parsedLastMileage =
    parseOptionalNumber(lastServiceMileage);

  const nextMileage =
    parsedIntervalKm != null &&
    parsedLastMileage != null
      ? parsedIntervalKm + parsedLastMileage
      : null;

  const handleSave = async () => {
    if (!carId) {
      Alert.alert(
        'Car not found',
        'Open maintenance setup from a car.',
      );
      return;
    }

    if (schedulesLoading || schedulesError) {
      Alert.alert(
        'Unable to load schedules',
        'Please retry when maintenance data is available.',
      );
      return;
    }

    const km = parseOptionalNumber(intervalKm);
    const months = parseOptionalNumber(intervalMonths);
    const mileage =
      parseOptionalNumber(lastServiceMileage);
    const date = parseDate(lastServiceDate);
    const warningKmValue =
      parseOptionalNumber(warningKm);
    const warningDaysValue =
      parseOptionalNumber(warningDays);

    if (
      km === undefined ||
      months === undefined ||
      mileage === undefined ||
      warningKmValue === undefined ||
      warningDaysValue === undefined
    ) {
      Alert.alert(
        'Invalid number',
        'Enter whole, non-negative numbers.',
      );
      return;
    }

    if (km === null && months === null) {
      Alert.alert(
        'Interval required',
        'Enter a mileage interval, a time interval, or both.',
      );
      return;
    }

    if (
      (km !== null && km === 0) ||
      (months !== null && months === 0)
    ) {
      Alert.alert(
        'Invalid interval',
        'Maintenance intervals must be greater than zero.',
      );
      return;
    }

    if (date === undefined) {
      Alert.alert(
        'Invalid date',
        'Use the format YYYY-MM-DD.',
      );
      return;
    }

    if (
      (km !== null && mileage === null) ||
      (months !== null && date === null)
    ) {
      Alert.alert(
        'Last service required',
        'For mileage reminders, enter the last service mileage. For date reminders, enter the last service date.',
      );
      return;
    }

    if (
      warningKmValue === null ||
      warningDaysValue === null
    ) {
      Alert.alert(
        'Reminder required',
        'Enter warning thresholds, or use zero to disable an early warning.',
      );
      return;
    }

    const data: SaveMaintenanceScheduleInput = {
      type: selectedType,
      enabled,
      intervalKm: km,
      intervalMonths: months,
      lastServiceMileage: mileage,
      lastServiceDate: date,
      warningKm: warningKmValue,
      warningDays: warningDaysValue,
      notes: notes.trim() || null,
    };

    try {
      await saveSchedule.mutateAsync({
        carId,
        data,
      });

      router.back();
    } catch (error) {
      Alert.alert(
        'Unable to save schedule',
        error instanceof Error
          ? error.message
          : 'Please try again.',
      );
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{ headerShown: false }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 35,
            },
          ]}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft
                size={23}
                color={C.navy}
              />
            </Pressable>

            <Text style={styles.headerTitle}>
              Maintenance Setup
            </Text>

            <View style={{ width: 44 }} />
          </View>

          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Wrench
                size={24}
                color={C.navy}
              />
            </View>

            <Text style={styles.title}>
              Stay ahead of maintenance
            </Text>

            <Text style={styles.subtitle}>
              Set your service intervals and LovableCar
              will track when maintenance is due.
            </Text>

            {car ? (
              <Text style={styles.carLabel}>
                {car.make} {car.model} · {car.year}
              </Text>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>
            Maintenance type
          </Text>

          <View style={styles.card}>
            <Pressable
              style={styles.typeSelector}
              onPress={() =>
                setTypePickerOpen(!typePickerOpen)
              }
            >
              <View style={styles.typeIcon}>
                <Wrench
                  size={20}
                  color={C.blue}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.typeName}>
                  {selectedLabel}
                </Text>

                <Text style={styles.typeHint}>
                  {existingSchedule
                    ? 'Existing schedule · edit settings'
                    : 'New schedule'}
                </Text>
              </View>

              <ChevronDown
                size={20}
                color={C.muted}
              />
            </Pressable>

            {typePickerOpen &&
              TYPES.map((item) => (
                <Pressable
                  key={item.type}
                  style={styles.typeOption}
                  onPress={() => {
                    setSelectedType(item.type);
                    setTypePickerOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionName}>
                      {item.label}
                    </Text>

                    <Text style={styles.optionHint}>
                      {item.description}
                    </Text>
                  </View>

                  {selectedType === item.type && (
                    <Check
                      size={20}
                      color={C.green}
                    />
                  )}
                </Pressable>
              ))}
          </View>

          {schedulesLoading ? (
            <ActivityIndicator
              style={{ marginTop: 20 }}
              color={C.blue}
            />
          ) : schedulesError ? (
            <Text style={styles.errorText}>
              Could not load existing schedules.
              Please try again.
            </Text>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                Service interval
              </Text>

              <View style={styles.card}>
                <Text style={styles.cardDescription}>
                  Set how often this maintenance should
                  happen. You can use kilometers, months,
                  or both.
                </Text>

                <View style={styles.fieldRow}>
                  <View style={styles.halfField}>
                    <Field
                      label="Every (km)"
                      value={intervalKm}
                      onChangeText={setIntervalKm}
                      placeholder="10000"
                    />
                  </View>

                  <View style={styles.halfField}>
                    <Field
                      label="Every (months)"
                      value={intervalMonths}
                      onChangeText={setIntervalMonths}
                      placeholder="12"
                    />
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Info size={16} color={C.blue} />

                  <Text style={styles.infoText}>
                    If both are set, service is due when
                    either interval is reached.
                  </Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>
                Last service
              </Text>

              <View style={styles.card}>
                <Text style={styles.cardDescription}>
                  Enter when this maintenance was last
                  performed. Use your service history
                  for reference.
                </Text>

                <Field
                  label="Mileage at last service (km)"
                  value={lastServiceMileage}
                  onChangeText={setLastServiceMileage}
                  placeholder="120000"
                />

                <Field
                  label="Last service date"
                  value={lastServiceDate}
                  onChangeText={setLastServiceDate}
                  placeholder="2026-10-15"
                  keyboardType="default"
                />

                <Text style={styles.fieldHelp}>
                  Date format: YYYY-MM-DD
                </Text>
              </View>

              {nextMileage !== null && (
                <View style={styles.nextCard}>
                  <View style={styles.nextIcon}>
                    <Gauge
                      size={22}
                      color={C.blue}
                    />
                  </View>

                  <View>
                    <Text style={styles.nextLabel}>
                      Next service mileage
                    </Text>

                    <Text style={styles.nextValue}>
                      {nextMileage.toLocaleString(
                        'en-US',
                      )}{' '}
                      km
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.sectionTitle}>
                Reminder settings
              </Text>

              <View style={styles.card}>
                <View style={styles.reminderHeader}>
                  <View style={styles.reminderIcon}>
                    <Bell
                      size={21}
                      color={C.blue}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderTitle}>
                      Enable reminders
                    </Text>

                    <Text style={styles.optionHint}>
                      Track upcoming maintenance
                    </Text>
                  </View>

                  <Switch
                    value={enabled}
                    onValueChange={setEnabled}
                    trackColor={{
                      false: '#D6E1EA',
                      true: '#93D9C7',
                    }}
                    thumbColor={C.white}
                  />
                </View>

                <View style={styles.divider} />

                <Text style={styles.cardDescription}>
                  How early should LovableCar warn you?
                </Text>

                <View style={styles.fieldRow}>
                  <View style={styles.halfField}>
                    <Field
                      label="Before (km)"
                      value={warningKm}
                      onChangeText={setWarningKm}
                      placeholder="500"
                    />
                  </View>

                  <View style={styles.halfField}>
                    <Field
                      label="Before (days)"
                      value={warningDays}
                      onChangeText={setWarningDays}
                      placeholder="14"
                    />
                  </View>
                </View>
              </View>

              <Text style={styles.sectionTitle}>
                Notes
              </Text>

              <View style={styles.card}>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  textAlignVertical="top"
                  placeholder="Optional maintenance notes..."
                  placeholderTextColor="#A5B8C9"
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              <Pressable
                style={[
                  styles.saveButton,
                  saveSchedule.isPending &&
                    styles.disabledButton,
                ]}
                onPress={() => void handleSave()}
                disabled={saveSchedule.isPending}
              >
                {saveSchedule.isPending ? (
                  <ActivityIndicator
                    color={C.navy}
                  />
                ) : (
                  <>
                    <Save
                      size={20}
                      color={C.navy}
                    />

                    <Text style={styles.saveText}>
                      {existingSchedule
                        ? 'Save Changes'
                        : 'Create Schedule'}
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  screen: {
    flex: 1,
    backgroundColor: C.background,
  },

  scrollContent: {
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.navy,
  },

  intro: {
    marginTop: 26,
    marginBottom: 18,
  },

  introIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: C.sky,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  title: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '800',
    color: C.navy,
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: C.muted,
  },

  carLabel: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: C.sky,
    color: C.navy,
    fontWeight: '700',
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.navy,
    marginTop: 22,
    marginBottom: 12,
  },

  card: {
    backgroundColor: C.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: C.muted,
    marginBottom: 18,
  },

  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  typeIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },

  typeName: {
    fontSize: 15,
    fontWeight: '800',
    color: C.navy,
  },

  typeHint: {
    fontSize: 12,
    color: C.muted,
    marginTop: 5,
  },

  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 14,
    gap: 10,
  },

  optionName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.navy,
  },

  optionHint: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
    lineHeight: 17,
  },

  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },

  halfField: {
    flex: 1,
  },

  field: {
    marginBottom: 15,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
    marginBottom: 8,
  },

  input: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 13,
    backgroundColor: '#F6FAFD',
    borderWidth: 1,
    borderColor: C.border,
    color: C.navy,
    fontSize: 15,
    fontWeight: '700',
  },

  fieldHelp: {
    color: C.muted,
    fontSize: 12,
    marginTop: -5,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },

  infoText: {
    flex: 1,
    color: C.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  nextCard: {
    marginTop: 16,
    padding: 17,
    borderRadius: 19,
    backgroundColor: '#EAF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  nextIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextLabel: {
    fontSize: 12,
    color: C.muted,
  },

  nextValue: {
    fontSize: 21,
    fontWeight: '800',
    color: C.navy,
    marginTop: 4,
  },

  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  reminderIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: C.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },

  reminderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.navy,
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 18,
  },

  notesInput: {
    minHeight: 95,
    color: C.navy,
    fontSize: 14,
    lineHeight: 21,
  },

  saveButton: {
    height: 56,
    borderRadius: 17,
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
  },

  saveText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.navy,
  },

  disabledButton: {
    opacity: 0.6,
  },

  errorText: {
    color: C.red,
    marginTop: 20,
    fontSize: 13,
  },
});
