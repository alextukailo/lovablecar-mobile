
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

import { api } from '@/../lib/api';

export type Schedule = {
  id: string;
  type: string;
  customTitle?: string | null;
  enabled: boolean;
  intervalKm: number | null;
  intervalMonths: number | null;
  lastServiceMileage: number | null;
  lastServiceDate: string | null;
  warningKm: number;
  warningDays: number;
};

export type ScheduleChanges = {
  enabled: boolean;
  intervalKm: number | null;
  intervalMonths: number | null;
  lastServiceMileage: number | null;
  lastServiceDate: string | null;
  warningKm: number;
  warningDays: number;
};

type Props = {
  carId: string;
  onChange: (
    scheduleId: string | null,
    changes: ScheduleChanges | null,
  ) => void;
};

export default function InlineScheduleEditor({
  carId,
  onChange,
}: Props) {
  const { i18n } = useTranslation();
  const ru = i18n.resolvedLanguage?.startsWith('ru') ?? false;
  const tr = (en: string, russian: string) => ru ? russian : en;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [intervalKm, setIntervalKm] = useState('');
  const [intervalMonths, setIntervalMonths] = useState('');
  const [lastMileage, setLastMileage] = useState('');
  const [lastDate, setLastDate] = useState('');
  const [warningKm, setWarningKm] = useState('1000');
  const [warningDays, setWarningDays] = useState('30');

  const { data: schedules = [], isLoading, isError } = useQuery({
    queryKey: ['maintenance', carId],
    queryFn: async () => {
      const response = await api.get<Schedule[]>(
        `/cars/${encodeURIComponent(carId)}/maintenance`,
      );
      return response.data;
    },
  });

  const selected = schedules.find((s) => s.id === selectedId);

  useEffect(() => {
    if (!selected) return;
    setEnabled(selected.enabled);
    setIntervalKm(selected.intervalKm?.toString() ?? '');
    setIntervalMonths(selected.intervalMonths?.toString() ?? '');
    setLastMileage(selected.lastServiceMileage?.toString() ?? '');
    setLastDate(selected.lastServiceDate?.slice(0, 10) ?? '');
    setWarningKm(String(selected.warningKm));
    setWarningDays(String(selected.warningDays));
  }, [selectedId, schedules]);

  useEffect(() => {
    if (!selectedId) {
      onChange(null, null);
      return;
    }

    const optionalNumber = (value: string) =>
      value.trim() === '' ? null : Number(value);

    onChange(selectedId, {
      enabled,
      intervalKm: optionalNumber(intervalKm),
      intervalMonths: optionalNumber(intervalMonths),
      lastServiceMileage: optionalNumber(lastMileage),
      lastServiceDate: lastDate.trim() || null,
      warningKm: Number(warningKm),
      warningDays: Number(warningDays),
    });
  }, [
    selectedId,
    enabled,
    intervalKm,
    intervalMonths,
    lastMileage,
    lastDate,
    warningKm,
    warningDays,
  ]);

  const input = (
    title: string,
    value: string,
    setValue: (value: string) => void,
    date = false,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{title}</Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        keyboardType={date ? 'default' : 'number-pad'}
        placeholder={date ? 'YYYY-MM-DD' : '0'}
        style={styles.input}
        placeholderTextColor="#91ABC5"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Ionicons name="calendar-outline" size={23} color="#102647" />
        <Text style={styles.title}>
          {tr('Maintenance Schedule', 'График обслуживания')}
        </Text>
      </View>

      <Text style={styles.description}>
        {tr(
          'Select an existing schedule to edit its intervals and reminders.',
          'Выберите существующий график для изменения интервалов и напоминаний.',
        )}
      </Text>

      {isLoading ? (
        <ActivityIndicator color="#102647" />
      ) : isError ? (
        <Text style={styles.description}>
          {tr('Unable to load schedules.', 'Не удалось загрузить графики.')}
        </Text>
      ) : schedules.length === 0 ? (
        <Text style={styles.description}>
          {tr(
            'No schedules have been configured for this car.',
            'Для этого автомобиля пока нет графиков обслуживания.',
          )}
        </Text>
      ) : (
        <>
          {schedules.map((schedule) => (
            <Pressable
              key={schedule.id}
              onPress={() =>
                setSelectedId(
                  selectedId === schedule.id ? null : schedule.id,
                )
              }
              style={[
                styles.scheduleItem,
                selectedId === schedule.id && styles.selected,
              ]}
            >
              <Ionicons
                name={
                  selectedId === schedule.id
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={22}
                color="#102647"
              />
              <Text style={styles.scheduleName}>
                {schedule.customTitle || schedule.type.replace(/_/g, ' ')}
              </Text>
            </Pressable>
          ))}

          {selected && (
            <View style={styles.fields}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  {tr('Enable reminders', 'Включить напоминания')}
                </Text>
                <Switch
                  value={enabled}
                  onValueChange={setEnabled}
                  trackColor={{ true: '#FFD33F' }}
                />
              </View>

              {input(
                tr('Interval (km)', 'Интервал (км)'),
                intervalKm,
                setIntervalKm,
              )}
              {input(
                tr('Interval (months)', 'Интервал (месяцы)'),
                intervalMonths,
                setIntervalMonths,
              )}
              {input(
                tr('Last service mileage', 'Пробег последнего ТО'),
                lastMileage,
                setLastMileage,
              )}
              {input(
                tr('Last service date', 'Дата последнего ТО'),
                lastDate,
                setLastDate,
                true,
              )}
              {input(
                tr('Warn before (km)', 'Предупредить за (км)'),
                warningKm,
                setWarningKm,
              )}
              {input(
                tr('Warn before (days)', 'Предупредить за (дней)'),
                warningDays,
                setWarningDays,
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#E2EDF6',
    paddingTop: 22,
    gap: 14,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#102647',
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: '#41668B',
  },
  scheduleItem: {
    borderWidth: 1,
    borderColor: '#DCE8F3',
    borderRadius: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selected: {
    backgroundColor: '#FFF7D7',
    borderColor: '#FFD33F',
  },
  scheduleName: {
    color: '#102647',
    fontWeight: '700',
    flex: 1,
  },
  fields: {
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    color: '#41668B',
    fontSize: 13,
  },
  input: {
    height: 52,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DCE8F3',
    backgroundColor: '#FBFDFF',
    paddingHorizontal: 14,
    color: '#102647',
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    color: '#102647',
    fontWeight: '700',
  },
});
