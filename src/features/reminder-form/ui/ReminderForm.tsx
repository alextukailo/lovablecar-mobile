
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ReminderInput } from '../../../entities/reminder';
import DateTimeField from '../../../shared/ui/DateTimeField';

const COLORS = {
  navy: '#102647',
  blue: '#41668B',
  sky: '#EAF6FF',
  yellow: '#FFD33F',
  white: '#FFFFFF',
  border: '#DFE9F2',
  muted: '#8296AA',
  input: '#F7FBFF',
};

type ReminderFormProps = {
  mode: 'create' | 'edit';
  initialText?: string;
  initialDate?: Date;
  saving?: boolean;
  onSubmit: (input: ReminderInput) => Promise<void>;
  onCancel: () => void;
};

function getDefaultDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
}

export default function ReminderForm({
  mode,
  initialText = '',
  initialDate,
  saving = false,
  onSubmit,
  onCancel,
}: ReminderFormProps) {
  const { i18n } = useTranslation();

  const isRussian =
    i18n.resolvedLanguage?.startsWith('ru') ?? false;

  const locale = isRussian ? 'ru-RU' : 'en-GB';

  const tr = (en: string, ru: string) =>
    isRussian ? ru : en;

  const [text, setText] = useState(initialText);

  const [scheduledAt, setScheduledAt] = useState<Date>(
    () => initialDate ?? getDefaultDate(),
  );

  const [submitting, setSubmitting] = useState(false);

  const isSaving = saving || submitting;

  async function handleSubmit() {
    if (isSaving) return;

    Keyboard.dismiss();

    const trimmed = text.trim();

    if (!trimmed) {
      Alert.alert(
        tr('Required field', 'Обязательное поле'),
        tr(
          'Please enter reminder text.',
          'Введите текст напоминания.',
        ),
      );
      return;
    }

    if (trimmed.length > 500) {
      Alert.alert(
        tr('Text too long', 'Слишком длинный текст'),
        tr(
          'Maximum 500 characters.',
          'Максимум 500 символов.',
        ),
      );
      return;
    }

    if (Number.isNaN(scheduledAt.getTime())) {
      Alert.alert(
        tr('Invalid date', 'Неверная дата'),
        tr(
          'Please select a valid date.',
          'Выберите корректную дату.',
        ),
      );
      return;
    }

    if (scheduledAt.getTime() <= Date.now()) {
      Alert.alert(
        tr('Invalid date', 'Неверная дата'),
        tr(
          'Please choose a future date and time.',
          'Выберите будущую дату и время.',
        ),
      );
      return;
    }

    const input: ReminderInput = {
      text: trimmed,
      scheduledAt: scheduledAt.toISOString(),
      timeZone:
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        'UTC',
    };

    setSubmitting(true);

    try {
      await onSubmit(input);
    } catch (error) {
      Alert.alert(
        tr('Unable to save', 'Не удалось сохранить'),
        error instanceof Error
          ? error.message
          : tr(
              'Please try again.',
              'Попробуйте ещё раз.',
            ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView 
        style={styles.screen}
        edges={['top', 'bottom']}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={onCancel}
          disabled={isSaving}
          hitSlop={10}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color={COLORS.navy}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          {mode === 'create'
            ? tr('New Reminder', 'Новое напоминание')
            : tr('Edit Reminder', 'Редактировать')}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons
                name="notifications-outline"
                size={27}
                color={COLORS.yellow}
              />
            </View>

            <Text style={styles.heroTitle}>
              {mode === 'create'
                ? tr(
                    'Create a personal reminder',
                    'Создайте личное напоминание',
                  )
                : tr(
                    'Update your reminder',
                    'Измените напоминание',
                  )}
            </Text>

            <Text style={styles.heroDescription}>
              {tr(
                'Choose when LovableCar should remind you about an important task.',
                'Выберите, когда LovableCar напомнит вам о важном деле.',
              )}
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.label}>
              {tr('Reminder text', 'Текст напоминания')}
            </Text>

            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={tr(
                'e.g. Switch to summer tires',
                'Например: Поменять шины на летние',
              )}
              placeholderTextColor={COLORS.muted}
              multiline
              maxLength={500}
              editable={!isSaving}
              textAlignVertical="top"
              style={styles.textArea}
            />

            <Text style={styles.counter}>
              {text.length}/500
            </Text>

            <DateTimeField
              label={tr(
                'Notification date',
                'Дата уведомления',
              )}
              mode="date"
              value={scheduledAt}
              onChange={setScheduledAt}
              minimumDate={new Date()}
              locale={locale}
              disabled={isSaving}
            />

            <DateTimeField
              label={tr(
                'Notification time',
                'Время уведомления',
              )}
              mode="time"
              value={scheduledAt}
              onChange={setScheduledAt}
              locale={locale}
              disabled={isSaving}
            />
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="paper-plane-outline"
              size={22}
              color={COLORS.blue}
            />

            <Text style={styles.infoText}>
              {tr(
                'This reminder will be sent through your connected Telegram bot.',
                'Напоминание будет отправлено через подключённый Telegram-бот.',
              )}
            </Text>
          </View>

          <Pressable
            style={[
              styles.saveButton,
              isSaving && styles.disabledButton,
            ]}
            disabled={isSaving}
            onPress={() => void handleSubmit()}
          >
            {isSaving ? (
              <ActivityIndicator color={COLORS.navy} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={23}
                  color={COLORS.navy}
                />

                <Text style={styles.saveButtonText}>
                  {mode === 'create'
                    ? tr(
                        'Create reminder',
                        'Создать напоминание',
                      )
                    : tr(
                        'Save changes',
                        'Сохранить изменения',
                      )}
                </Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.sky,
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: COLORS.navy,
    fontSize: 18,
    fontWeight: '800',
  },

  headerSpacer: {
    width: 42,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
    paddingBottom: 70,
    gap: 18,
  },

  hero: {
    backgroundColor: COLORS.navy,
    borderRadius: 22,
    padding: 22,
    gap: 10,
  },

  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#244265',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 21,
    fontWeight: '800',
  },

  heroDescription: {
    color: '#D5E5F4',
    fontSize: 13,
    lineHeight: 21,
  },

  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  label: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 11,
  },

  textArea: {
    backgroundColor: COLORS.input,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 110,
    padding: 14,
    fontSize: 15,
    color: COLORS.navy,
  },

  counter: {
    color: COLORS.muted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 23,
  },

  infoBox: {
    backgroundColor: '#DCEEF9',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  infoText: {
    flex: 1,
    color: COLORS.blue,
    fontSize: 13,
    lineHeight: 20,
  },

  saveButton: {
    backgroundColor: COLORS.yellow,
    borderRadius: 18,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  saveButtonText: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.5,
  },
});
