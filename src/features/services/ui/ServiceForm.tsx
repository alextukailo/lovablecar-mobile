
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import {
    createServiceSchema,
    supportedCurrencyOptions,
    type ServiceFormValues,
} from '../model/service.schema';

type Props = {
  defaultValues: ServiceFormValues;
  submitLabel: string;
  onSubmit: (values: ServiceFormValues) => void | Promise<void>;
  onScanDocument?: () => void;
  onChooseDocument?: () => void;
  beforeSubmit?: ReactNode;
};

const C = {
  navy: '#102647',
  blue: '#41668B',
  border: '#DCE8F3',
  sky: '#F2F9FF',
  white: '#FFFFFF',
  yellow: '#FFD33F',
  muted: '#91ABC5',
};

export default function ServiceForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onScanDocument,
  onChooseDocument,
  beforeSubmit,
}: Props) {
  const { t, i18n } = useTranslation();
  const ru = i18n.resolvedLanguage?.startsWith('ru') ?? false;
  const tr = (en: string, russian: string) =>
    ru ? russian : en;

  const [tab, setTab] = useState<'manual' | 'scan'>('manual');
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(
      createServiceSchema((key) => t(`serviceValidation.${key}`)),
    ),
    defaultValues,
    mode: 'onBlur',
  });

  const field = (
    name: keyof ServiceFormValues,
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string,
    multiline = false,
    keyboardType:
      | 'default'
      | 'number-pad'
      | 'decimal-pad' = 'default',
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{title}</Text>

      <View
        style={[
          styles.inputBox,
          multiline && styles.multilineBox,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={C.navy}
          style={styles.fieldIcon}
        />

        <Controller
          control={control}
          name={name}
          render={({ field: f }) => (
            <TextInput
              value={f.value}
              onChangeText={f.onChange}
              onBlur={f.onBlur}
              placeholder={placeholder}
              placeholderTextColor={C.muted}
              keyboardType={keyboardType}
              multiline={multiline}
              textAlignVertical={
                multiline ? 'top' : 'center'
              }
              style={[
                styles.input,
                multiline && styles.multilineInput,
              ]}
            />
          )}
        />
      </View>

      {errors[name] && (
        <Text style={styles.error}>
          {errors[name]?.message}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      {/* TABS */}

      <View style={styles.tabs}>
        <Pressable
          style={[
            styles.tab,
            tab === 'manual' && styles.activeTab,
          ]}
          onPress={() => setTab('manual')}
        >
          <Text
            style={[
              styles.tabText,
              tab === 'manual' && styles.activeTabText,
            ]}
          >
            {tr('Manual', 'Вручную')}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tab,
            tab === 'scan' && styles.activeTab,
          ]}
          onPress={() => setTab('scan')}
        >
          <Text
            style={[
              styles.tabText,
              tab === 'scan' && styles.activeTabText,
            ]}
          >
            {tr('Scan Document', 'Сканировать')}
          </Text>
        </Pressable>
      </View>

      {tab === 'scan' ? (
        /* SCAN TAB */

        <View style={styles.scanSection}>
          <View style={styles.scanIllustration}>
            <Ionicons
              name="document-text-outline"
              size={78}
              color="#82B5DF"
            />

            <View style={styles.cameraCircle}>
              <Ionicons
                name="camera"
                size={34}
                color="white"
              />
            </View>
          </View>

          <Text style={styles.scanTitle}>
            {tr(
              'Scan Service Document',
              'Сканировать документ',
            )}
          </Text>

          <Text style={styles.scanDescription}>
            {tr(
              'Take a photo or choose a file to automatically fill in the service details.',
              'Сфотографируйте документ или выберите файл для автоматического заполнения.',
            )}
          </Text>

          <Pressable
            style={[
              styles.saveButton,
              !onScanDocument && styles.disabled,
            ]}
            onPress={onScanDocument}
            disabled={!onScanDocument}
          >
            <Ionicons
              name="camera"
              size={22}
              color={C.navy}
            />

            <Text style={styles.saveText}>
              {tr('Take Photo', 'Сделать фото')}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.galleryButton,
              !onChooseDocument && styles.disabled,
            ]}
            onPress={onChooseDocument}
            disabled={!onChooseDocument}
          >
            <Ionicons
              name="image-outline"
              size={22}
              color={C.navy}
            />

            <Text style={styles.galleryText}>
              {tr(
                'Choose from Gallery',
                'Выбрать из галереи',
              )}
            </Text>
          </Pressable>
        </View>
      ) : (
        /* MANUAL TAB */

        <View style={styles.form}>
          {field(
            'date',
            tr('Date', 'Дата'),
            'calendar-outline',
            'YYYY-MM-DD',
          )}

          {field(
            'mileage',
            tr('Mileage (km)', 'Пробег (км)'),
            'speedometer-outline',
            '126665',
            false,
            'number-pad',
          )}

          {field(
            'serviceName',
            tr(
              'Service description',
              'Описание обслуживания',
            ),
            'document-text-outline',
            tr(
              'Describe the service...',
              'Описание работ...',
            ),
            true,
          )}

          {/* TOTAL COST */}

          <View style={styles.field}>
            <Text style={styles.label}>
              {tr('Total cost', 'Стоимость')}
            </Text>

            <View style={styles.costRow}>
              <View
                style={[
                  styles.inputBox,
                  styles.costInput,
                ]}
              >
                <Ionicons
                  name="cash-outline"
                  size={20}
                  color={C.navy}
                />

                <Controller
                  control={control}
                  name="totalCost"
                  render={({ field: f }) => (
                    <TextInput
                      value={f.value}
                      onChangeText={f.onChange}
                      onBlur={f.onBlur}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                      placeholderTextColor={C.muted}
                      style={styles.input}
                    />
                  )}
                />
              </View>

              <Controller
                control={control}
                name="currency"
                render={({ field: f }) => (
                  <View style={styles.currencyWrapper}>
                    <Pressable
                      style={styles.currencyButton}
                      onPress={() =>
                        setCurrencyOpen(!currencyOpen)
                      }
                    >
                      <Text style={styles.currencyText}>
                        {f.value}
                      </Text>

                      <Ionicons
                        name={
                          currencyOpen
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={17}
                        color={C.navy}
                      />
                    </Pressable>

                    {currencyOpen && (
                      <View style={styles.currencyMenu}>
                        {supportedCurrencyOptions.map(
                          (option) => (
                            <Pressable
                              key={option.value}
                              style={styles.currencyItem}
                              onPress={() => {
                                f.onChange(option.value);
                                setCurrencyOpen(false);
                              }}
                            >
                              <Text
                                style={styles.currencyText}
                              >
                                {option.label}
                              </Text>
                            </Pressable>
                          ),
                        )}
                      </View>
                    )}
                  </View>
                )}
              />
            </View>

            {errors.totalCost && (
              <Text style={styles.error}>
                {errors.totalCost.message}
              </Text>
            )}
          </View>

          {/* WORKSHOP */}

          {field(
            'workshop',
            tr('Workshop', 'Автосервис'),
            'business-outline',
            tr(
              'Workshop name',
              'Название автосервиса',
            ),
          )}

          {/* MAINTENANCE SCHEDULE
              This section is displayed only when
              the parent screen supplies it.
              It is INSIDE the manual form,
              immediately before Save Changes.
          */}

          {beforeSubmit}

          {/* SAVE CHANGES */}

          <Pressable
            style={[
              styles.saveButton,
              isSubmitting && styles.disabled,
            ]}
            disabled={isSubmitting}
            onPress={() =>
              void handleSubmit(onSubmit)()
            }
          >
            {isSubmitting ? (
              <ActivityIndicator color={C.navy} />
            ) : (
              <Text style={styles.saveText}>
                {submitLabel}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    paddingBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F5FAFE',
    borderRadius: 16,
    marginBottom: 22,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    backgroundColor: C.white,
    borderBottomColor: '#FFC400',
  },
  tabText: {
    color: C.blue,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: C.navy,
    fontWeight: '700',
  },
  form: {
    gap: 18,
  },
  field: {
    gap: 7,
  },
  label: {
    color: C.blue,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  inputBox: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FBFDFF',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 12,
  },
  fieldIcon: {
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: C.navy,
    paddingVertical: 12,
  },
  multilineBox: {
    minHeight: 88,
    alignItems: 'flex-start',
  },
  multilineInput: {
    minHeight: 80,
  },
  costRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  costInput: {
    flex: 1,
  },
  currencyWrapper: {
    width: 104,
    position: 'relative',
    zIndex: 10,
  },
  currencyButton: {
    height: 52,
    backgroundColor: C.sky,
    borderColor: C.border,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyText: {
    color: C.navy,
    fontSize: 14,
    fontWeight: '600',
  },
  currencyMenu: {
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginTop: 4,
    maxHeight: 210,
  },
  currencyItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  saveButton: {
    width: '100%',
    marginTop: 15,
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  saveText: {
    color: C.navy,
    fontSize: 16,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    color: '#D04B4B',
    fontSize: 12,
    marginLeft: 8,
  },
  scanSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 24,
    gap: 14,
  },
  scanIllustration: {
    width: 190,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cameraCircle: {
    position: 'absolute',
    bottom: 5,
    right: 15,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#258FE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: C.navy,
    textAlign: 'center',
  },
  scanDescription: {
    fontSize: 15,
    lineHeight: 23,
    color: C.blue,
    textAlign: 'center',
    marginBottom: 24,
  },
  galleryButton: {
    backgroundColor: '#E5F2FC',
    borderRadius: 24,
    minHeight: 56,
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  galleryText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.navy,
  },
});
