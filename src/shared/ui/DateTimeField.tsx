
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const COLORS = {
  navy: '#102647',
  blue: '#41668B',
  white: '#FFFFFF',
  background: '#F7FBFF',
  border: '#DFE9F2',
};

type PickerMode = 'date' | 'time';

type Props = {
  label: string;
  value: Date;
  mode: PickerMode;
  onChange: (date: Date) => void;
  locale?: string;
  minimumDate?: Date;
  disabled?: boolean;
};

function mergeDate(
  current: Date,
  selected: Date,
  mode: PickerMode,
): Date {
  const next = new Date(current);

  if (mode === 'date') {
    next.setFullYear(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate(),
    );
  } else {
    next.setHours(
      selected.getHours(),
      selected.getMinutes(),
      0,
      0,
    );
  }

  return next;
}

function formatValue(
  value: Date,
  mode: PickerMode,
  locale: string,
): string {
  if (mode === 'date') {
    return value.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  return value.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function DateTimeField({
  label,
  value,
  mode,
  onChange,
  locale = 'en-GB',
  minimumDate,
  disabled = false,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  function openPicker() {
    if (disabled) return;

    Keyboard.dismiss();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        is24Hour: true,
        minimumDate:
          mode === 'date' ? minimumDate : undefined,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            onChange(mergeDate(value, selected, mode));
          }
        },
      });

      return;
    }

    setExpanded((previous) => !previous);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        style={[
          styles.field,
          expanded && styles.activeField,
          disabled && styles.disabled,
        ]}
        onPress={openPicker}
        disabled={disabled}
      >
        <Ionicons
          name={
            mode === 'date'
              ? 'calendar-outline'
              : 'time-outline'
          }
          size={21}
          color={COLORS.blue}
        />

        <Text style={styles.value}>
          {formatValue(value, mode, locale)}
        </Text>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.blue}
        />
      </Pressable>

      {Platform.OS === 'ios' && expanded && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            mode={mode}
            display="spinner"
            value={value}
            locale={locale}
            is24Hour
            minimumDate={
              mode === 'date' ? minimumDate : undefined
            }
            themeVariant="light"
            onChange={(_, selected) => {
              if (selected) {
                onChange(mergeDate(value, selected, mode));
              }
            }}
            style={styles.picker}
          />

          <Pressable
            style={styles.doneButton}
            onPress={() => setExpanded(false)}
          >
            <Ionicons
              name="checkmark"
              size={18}
              color={COLORS.white}
            />
            <Text style={styles.doneText}>
              {locale.startsWith('ru')
                ? 'Готово'
                : 'Done'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  label: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 11,
  },
  field: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    minHeight: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeField: {
    borderColor: COLORS.blue,
  },
  disabled: {
    opacity: 0.5,
  },
  value: {
    flex: 1,
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '600',
  },
  pickerContainer: {
    marginTop: 10,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  picker: {
    width: '100%',
    height: 190,
  },
  doneButton: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },
  doneText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
