
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

export type ServiceSchedule = {
  id?: string;
  enabled: boolean;
  intervalKm: number | null;
  intervalMonths: number | null;
  warningKm: number;
  warningDays: number;
  lastServiceMileage?: number | null;
  lastServiceDate?: string | null;
  nextDueMileage?: number | null;
  nextDueDate?: string | null;
};

export type ScheduleUpdate = {
  enabled: boolean;
  intervalKm: number | null;
  intervalMonths: number | null;
  nextDueDate?: string | null;
  warningKm: number;
  warningDays: number;
};

type Props = {
  schedule?: ServiceSchedule | null;
  onChange: (value: ScheduleUpdate) => void;
};

const C = {
  navy: '#102647',
  blue: '#41668B',
  yellow: '#FFD33F',
  background: '#FFFFFF',
  input: '#F8FBFE',
  border: '#DFE9F2',
  muted: '#8296AA',
};

function parseNumber(value: string): number | null {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : null;
}

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(value: string): Date {
  const parts = value.split('-').map(Number);

  if (
    parts.length !== 3 ||
    parts.some((part) => !Number.isFinite(part))
  ) {
    return new Date();
  }

  return new Date(parts[0], parts[1] - 1, parts[2], 12);
}

function NumberField({
  label,
  value,
  onChangeText,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.inputBox}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor={C.muted}
          style={styles.input}
        />

        <Text style={styles.suffix}>{suffix}</Text>
      </View>
    </View>
  );
}

function OptionCard({
  selected,
  title,
  description,
  icon,
  onPress,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[
        styles.optionCard,
        selected && styles.optionCardSelected,
      ]}
    >
      <View
        style={[
          styles.checkbox,
          selected && styles.checkboxSelected,
        ]}
      >
        {selected && (
          <Ionicons
            name="checkmark"
            size={15}
            color={C.navy}
          />
        )}
      </View>

      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDescription}>
          {description}
        </Text>
      </View>

      <Ionicons
        name={icon}
        size={23}
        color={selected ? C.navy : C.muted}
      />
    </Pressable>
  );
}

export default function ServiceScheduleEditor({
  schedule,
  onChange,
}: Props) {
  const { i18n } = useTranslation();

  const ru =
    i18n.resolvedLanguage?.startsWith('ru') ?? false;

  const tr = (en: string, russian: string) =>
    ru ? russian : en;

  const [enabled, setEnabled] = useState(
    schedule?.enabled ?? false,
  );

  const [useKm, setUseKm] = useState(
    schedule ? schedule.intervalKm != null : true,
  );

  const [useDate, setUseDate] = useState(
    Boolean(schedule?.nextDueDate),
  );

  const [intervalKm, setIntervalKm] = useState(
    String(schedule?.intervalKm ?? 10000),
  );

  const [dueDate, setDueDate] = useState(
    schedule?.nextDueDate?.slice(0, 10) ?? '',
  );

  const [warningKm, setWarningKm] = useState(
    String(schedule?.warningKm ?? 500),
  );

  const [warningDays, setWarningDays] = useState(
    String(schedule?.warningDays ?? 7),
  );

  const [calendarVisible, setCalendarVisible] =
    useState(false);

  const [temporaryDate, setTemporaryDate] =
    useState(new Date());

  // Synchronize existing schedule

  useEffect(() => {
    setEnabled(schedule?.enabled ?? false);

    setUseKm(
      schedule ? schedule.intervalKm != null : true,
    );

    setUseDate(Boolean(schedule?.nextDueDate));

    setIntervalKm(
      String(schedule?.intervalKm ?? 10000),
    );

    setDueDate(
      schedule?.nextDueDate?.slice(0, 10) ?? '',
    );

    setWarningKm(
      String(schedule?.warningKm ?? 500),
    );

    setWarningDays(
      String(schedule?.warningDays ?? 7),
    );
  }, [
    schedule?.id,
    schedule?.enabled,
    schedule?.intervalKm,
    schedule?.nextDueDate,
    schedule?.warningKm,
    schedule?.warningDays,
  ]);

  // Notify parent about changes

  useEffect(() => {
    onChange({
      enabled,
      intervalKm: useKm
        ? parseNumber(intervalKm)
        : null,
      intervalMonths: null,
      nextDueDate:
        useDate && dueDate ? dueDate : null,
      warningKm: Number(warningKm),
      warningDays: Number(warningDays),
    });
  }, [
    enabled,
    useKm,
    intervalKm,
    useDate,
    dueDate,
    warningKm,
    warningDays,
    onChange,
  ]);

  const openCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const initial = dueDate
      ? parseDate(dueDate)
      : today;

    const selected =
      initial.getTime() < today.getTime()
        ? today
        : initial;

    setTemporaryDate(selected);

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selected,
        mode: 'date',
        minimumDate: today,
        onChange: (event, date) => {
          if (event.type === 'set' && date) {
            setDueDate(toDateString(date));
          }
        },
      });
      return;
    }

    setCalendarVisible(true);
  };

  const confirmDate = () => {
    setDueDate(toDateString(temporaryDate));
    setCalendarVisible(false);
  };

  const toggleKm = () => {
    if (useKm && !useDate) {
      setUseDate(true);
    }
    setUseKm(!useKm);
  };

  const toggleDate = () => {
    if (useDate && !useKm) {
      setUseKm(true);
    }

    if (!useDate && !dueDate) {
      setDueDate(toDateString(new Date()));
    }

    setUseDate(!useDate);
  };

  const displayDate = dueDate
    ? parseDate(dueDate).toLocaleDateString(
        ru ? 'ru-RU' : 'en-US',
        {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        },
      )
    : tr('Choose date', 'Выберите дату');

  return (
    <View style={styles.card}>
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {tr(
              'Schedule next service',
              'Запланировать следующее ТО',
            )}
          </Text>

          <Text style={styles.subtitle}>
            {tr(
              'Remind me when this service is due again',
              'Напомнить о повторном обслуживании',
            )}
          </Text>
        </View>

        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{
            false: '#DCE5EE',
            true: C.yellow,
          }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#DCE5EE"
        />
      </View>

      {enabled && (
        <>
          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>
            {tr(
              'SERVICE INTERVAL',
              'ИНТЕРВАЛ ОБСЛУЖИВАНИЯ',
            )}
          </Text>

          {/* MILEAGE OPTION */}

          <OptionCard
            selected={useKm}
            title={tr('By mileage', 'По пробегу')}
            description={tr(
              'After a certain number of kilometers',
              'Через определённое количество км',
            )}
            icon="speedometer-outline"
            onPress={toggleKm}
          />

          {useKm && (
            <View style={styles.expandedField}>
              <NumberField
                label={tr(
                  'Service every',
                  'Обслуживание каждые',
                )}
                value={intervalKm}
                onChangeText={setIntervalKm}
                suffix={tr('km', 'км')}
              />
            </View>
          )}

          {/* DATE OPTION */}

          <OptionCard
            selected={useDate}
            title={tr('By date', 'По дате')}
            description={tr(
              'Exact date of the next service',
              'Точная дата следующего ТО',
            )}
            icon="calendar-outline"
            onPress={toggleDate}
          />

          {useDate && (
            <View style={styles.expandedField}>
              <Text style={styles.fieldLabel}>
                {tr(
                  'Next service date',
                  'Дата следующего ТО',
                )}
              </Text>

              <Pressable
                style={styles.dateButton}
                onPress={openCalendar}
              >
                <Ionicons
                  name="calendar-outline"
                  size={21}
                  color={C.blue}
                />

                <Text style={styles.dateText}>
                  {displayDate}
                </Text>

                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={C.blue}
                />
              </Pressable>
            </View>
          )}

          {/* EXPLANATION */}

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={19}
              color={C.blue}
            />

            <Text style={styles.infoText}>
              {tr(
                'Choose mileage or date. You can use both conditions. The first reached condition triggers the reminder.',
                'Выберите пробег или дату. Можно использовать оба условия. Напоминание сработает при достижении первого из них.',
              )}
            </Text>
          </View>

          {/* WARNINGS */}

          <Text style={styles.sectionLabel}>
            {tr(
              'REMIND ME BEFORE',
              'НАПОМНИТЬ ЗАРАНЕЕ',
            )}
          </Text>

          <View style={styles.warningRow}>
            {useKm && (
              <NumberField
                label={tr('Mileage', 'Пробег')}
                value={warningKm}
                onChangeText={setWarningKm}
                suffix={tr('km', 'км')}
              />
            )}

            {useDate && (
              <NumberField
                label={tr('Days', 'Дней')}
                value={warningDays}
                onChangeText={setWarningDays}
                suffix={tr('days', 'дн')}
              />
            )}
          </View>
        </>
      )}

      {/* iOS CALENDAR MODAL */}

      {Platform.OS === 'ios' && (
        <Modal
          visible={calendarVisible}
          transparent
          animationType="slide"
          presentationStyle="overFullScreen"
          onRequestClose={() =>
            setCalendarVisible(false)
          }
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() =>
                setCalendarVisible(false)
              }
            />

            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>
                    {tr(
                      'Next service date',
                      'Дата следующего ТО',
                    )}
                  </Text>

                  <Text style={styles.modalSubtitle}>
                    {tr(
                      'Select a date',
                      'Выберите дату обслуживания',
                    )}
                  </Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={() =>
                    setCalendarVisible(false)
                  }
                >
                  <Ionicons
                    name="close"
                    size={22}
                    color={C.navy}
                  />
                </Pressable>
              </View>

              <DateTimePicker
                value={temporaryDate}
                mode="date"
                display="inline"
                locale={ru ? 'ru-RU' : 'en-US'}
                minimumDate={new Date()}
                onChange={(event, selected) => {
                  if (selected) {
                    setTemporaryDate(selected);
                  }
                }}
                style={styles.calendar}
                themeVariant="light"
                accentColor={C.navy}
              />

              <Pressable
                style={styles.confirmButton}
                onPress={confirmDate}
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={C.navy}
                />

                <Text style={styles.confirmText}>
                  {tr(
                    'Confirm date',
                    'Подтвердить дату',
                  )}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginTop: 6,
    marginBottom: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 17,
    fontWeight: '800',
    color: C.navy,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 19,
    color: C.blue,
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 20,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: C.blue,
    marginBottom: 14,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    minHeight: 76,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.input,
    marginBottom: 12,
    gap: 12,
  },

  optionCardSelected: {
    borderColor: '#E8BC26',
    backgroundColor: '#FFFDF3',
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.8,
    borderColor: C.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxSelected: {
    borderColor: C.yellow,
    backgroundColor: C.yellow,
  },

  optionText: {
    flex: 1,
    gap: 4,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.navy,
  },

  optionDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: C.blue,
  },

  expandedField: {
    marginBottom: 18,
    paddingHorizontal: 3,
  },

  field: {
    flex: 1,
    minWidth: 0,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.blue,
    marginBottom: 9,
  },

  inputBox: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.input,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '600',
    color: C.navy,
    paddingVertical: 12,
  },

  suffix: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '500',
  },

  dateButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    backgroundColor: C.input,
    paddingHorizontal: 14,
  },

  dateText: {
    flex: 1,
    color: C.navy,
    fontSize: 15,
    fontWeight: '600',
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EDF6FD',
    padding: 13,
    borderRadius: 13,
    marginBottom: 24,
  },

  infoText: {
    flex: 1,
    color: C.blue,
    fontSize: 12,
    lineHeight: 19,
  },

  warningRow: {
    flexDirection: 'row',
    gap: 12,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16,38,71,0.38)',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },

  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: '90%',
  },

  modalHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DCE5EE',
    alignSelf: 'center',
    marginBottom: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  modalHeaderText: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: C.navy,
  },

  modalSubtitle: {
    fontSize: 13,
    color: C.blue,
    marginTop: 4,
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.input,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendar: {
    width: '100%',
    height: 355,
    alignSelf: 'center',
  },

  confirmButton: {
    backgroundColor: C.yellow,
    minHeight: 54,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },

  confirmText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.navy,
  },
});
