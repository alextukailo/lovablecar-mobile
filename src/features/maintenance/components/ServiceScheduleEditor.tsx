
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

// --------------------------------------------------
// TYPES
// --------------------------------------------------

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

  warningKm: number;
  warningDays: number;
};

type Props = {
  schedule?: ServiceSchedule | null;
  onChange: (value: ScheduleUpdate) => void;
};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function parseOptional(value: string): number | null {
  const trimmed = value.trim();

  if (trimmed === '') {
    return null;
  }

  return Number(trimmed);
}

// --------------------------------------------------
// INPUT COMPONENT
// --------------------------------------------------

function ScheduleField({
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
      <Text style={styles.fieldLabel}>
        {label}
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor="#A3A3A3"
          selectTextOnFocus={false}
        />

        <Text style={styles.inputSuffix}>
          {suffix}
        </Text>
      </View>
    </View>
  );
}

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

export default function ServiceScheduleEditor({
  schedule,
  onChange,
}: Props) {
  const { i18n } = useTranslation();

  const ru =
    i18n.resolvedLanguage?.startsWith('ru') ??
    false;

  const tr = (
    english: string,
    russian: string,
  ) => (ru ? russian : english);

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [enabled, setEnabled] = useState(
    schedule?.enabled ?? false,
  );

  const [intervalKm, setIntervalKm] = useState(
    String(schedule?.intervalKm ?? '10000'),
  );

  const [intervalMonths, setIntervalMonths] = useState(
    String(schedule?.intervalMonths ?? '12'),
  );

  const [warningKm, setWarningKm] = useState(
    String(schedule?.warningKm ?? '500'),
  );

  const [warningDays, setWarningDays] = useState(
    String(schedule?.warningDays ?? '7'),
  );

  // --------------------------------------------------
  // SYNC EXISTING SCHEDULE
  // --------------------------------------------------

  useEffect(() => {
    setEnabled(schedule?.enabled ?? false);

    setIntervalKm(
      String(schedule?.intervalKm ?? '10000'),
    );

    setIntervalMonths(
      String(schedule?.intervalMonths ?? '12'),
    );

    setWarningKm(
      String(schedule?.warningKm ?? '500'),
    );

    setWarningDays(
      String(schedule?.warningDays ?? '7'),
    );
  }, [
    schedule?.id,
    schedule?.enabled,
    schedule?.intervalKm,
    schedule?.intervalMonths,
    schedule?.warningKm,
    schedule?.warningDays,
  ]);

  // --------------------------------------------------
  // SEND VALUES TO PARENT
  // --------------------------------------------------

  useEffect(() => {
    onChange({
      enabled,

      intervalKm: parseOptional(intervalKm),

      intervalMonths: parseOptional(intervalMonths),

      warningKm: Number(warningKm),

      warningDays: Number(warningDays),
    });
  }, [
    enabled,
    intervalKm,
    intervalMonths,
    warningKm,
    warningDays,
    onChange,
  ]);

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <View style={styles.scheduleCard}>
      {/* HEADER */}

      <View style={styles.scheduleHeader}>
        <View style={styles.scheduleHeaderText}>
          <Text style={styles.scheduleTitle}>
            {tr(
              'Schedule next service',
              'Запланировать следующее ТО',
            )}
          </Text>

          <Text style={styles.scheduleSubtitle}>
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
            false: '#D4D4D4',
            true: '#F5C400',
          }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#D4D4D4"
        />
      </View>

      {/* SCHEDULE SETTINGS */}

      {enabled && (
        <>
          <View style={styles.divider} />

          {/* INTERVAL */}

          <Text style={styles.sectionLabel}>
            {tr(
              'SERVICE INTERVAL',
              'ИНТЕРВАЛ ОБСЛУЖИВАНИЯ',
            )}
          </Text>

          <View style={styles.fieldsRow}>
            <ScheduleField
              label={tr('Mileage', 'Пробег')}
              value={intervalKm}
              onChangeText={setIntervalKm}
              suffix="km"
            />

            <ScheduleField
              label={tr('Time', 'Время')}
              value={intervalMonths}
              onChangeText={setIntervalMonths}
              suffix={tr('mo', 'мес')}
            />
          </View>

          <Text style={styles.hint}>
            {tr(
              'Leave one field empty to use only mileage or time.',
              'Оставьте одно поле пустым, чтобы использовать только пробег или время.',
            )}
          </Text>

          {/* WARNINGS */}

          <Text style={styles.sectionLabel}>
            {tr(
              'REMIND ME BEFORE',
              'НАПОМНИТЬ ЗАРАНЕЕ',
            )}
          </Text>

          <View style={styles.fieldsRow}>
            <ScheduleField
              label={tr('Mileage', 'Пробег')}
              value={warningKm}
              onChangeText={setWarningKm}
              suffix="km"
            />

            <ScheduleField
              label={tr('Days', 'Дней')}
              value={warningDays}
              onChangeText={setWarningDays}
              suffix={tr('days', 'дн')}
            />
          </View>

          <Text style={styles.hint}>
            {tr(
              'The next service will be calculated automatically from the service date, mileage and intervals.',
              'Следующее ТО будет рассчитано автоматически по дате, пробегу и интервалам обслуживания.',
            )}
          </Text>
        </>
      )}
    </View>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginTop: 6,
    marginBottom: 8,
  },

  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  scheduleHeaderText: {
    flex: 1,
  },

  scheduleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171717',
  },

  scheduleSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: '#737373',
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginVertical: 20,
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#737373',
    marginBottom: 12,
  },

  fieldsRow: {
    flexDirection: 'row',
    gap: 12,
  },

  field: {
    flex: 1,
    minWidth: 0,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },

  inputContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
  },

  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
    paddingVertical: 10,
  },

  inputSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A8A',
    marginLeft: 5,
  },

  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8A8A8A',
    marginTop: 10,
    marginBottom: 18,
  },
});
