
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CalendarDays, Camera, Check, ChevronDown,
    Coins, FileText, Image as ImageIcon,
    MapPin, Route,
} from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator, Pressable, ScrollView,
    StyleSheet, Text,
    View
} from 'react-native';

import FormError from '../../../components/forms/FormError';
import FormField from '../../../components/forms/FormField';
import {
    serviceSchema,
    supportedCurrencyOptions,
    type ServiceFormValues,
} from '../schemas/service.schema';

interface ServiceFormProps {
  defaultValues: ServiceFormValues;
  submitLabel: string;
  onSubmit: (values: ServiceFormValues) => void | Promise<void>;
  onScanDocument?: () => void;
  onChooseDocument?: () => void;
}

export default function ServiceForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onScanDocument,
  onChooseDocument,
}: ServiceFormProps) {
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fields}>
          <FormField
            control={control}
            name="date"
            label="Date"
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
            autoCorrect={false}
            icon={CalendarDays}
          />

          <FormField
            control={control}
            name="mileage"
            label="Mileage (km)"
            placeholder="128500"
            keyboardType="number-pad"
            icon={Route}
          />

          <FormField
            control={control}
            name="serviceName"
            label="Service description"
            placeholder="Describe the service performed"
            icon={FileText}
            multiline
            numberOfLines={4}
          />

          <View style={styles.field}>
            <Text style={styles.label}>Total cost</Text>

            <View style={styles.costRow}>
              <View style={styles.costField}>
                <FormField
                  control={control}
                  name="totalCost"
                  label=""
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  icon={Coins}
                />
              </View>

              <Controller
                control={control}
                name="currency"
                render={({ field, fieldState }) => (
                  <View style={styles.currencyWrapper}>
                    <Pressable
                      style={styles.currencyButton}
                      onPress={() => setCurrencyOpen(!currencyOpen)}
                      accessibilityRole="button"
                      accessibilityLabel="Choose currency"
                    >
                      <Text style={styles.currencyValue}>
                        {field.value}
                      </Text>
                      <ChevronDown size={16} color="#17365A" />
                    </Pressable>
                    <FormError message={fieldState.error?.message} />
                  </View>
                )}
              />
            </View>
          </View>

          <FormField
            control={control}
            name="workshop"
            label="Workshop"
            placeholder="Workshop name (optional)"
            icon={MapPin}
          />
        </View>

        {(onScanDocument || onChooseDocument) && (
          <View style={styles.scanSection}>
            <Text style={styles.scanSectionTitle}>
              Service document
            </Text>
            <Text style={styles.scanSectionDescription}>
              Add information from a service document
            </Text>

            {onScanDocument && (
              <Pressable
                onPress={onScanDocument}
                style={styles.secondaryButton}
              >
                <Camera size={20} color="#102C4B" />
                <Text style={styles.secondaryText}>
                  Scan Service Document
                </Text>
              </Pressable>
            )}

            {onChooseDocument && (
              <Pressable
                onPress={onChooseDocument}
                style={styles.secondaryButton}
              >
                <ImageIcon size={20} color="#102C4B" />
                <Text style={styles.secondaryText}>
                  Choose from Gallery
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={submit}
          disabled={isSubmitting}
          style={[
            styles.submitButton,
            isSubmitting && styles.disabledButton,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#102C4B" />
          ) : (
            <Text style={styles.submitText}>{submitLabel}</Text>
          )}
        </Pressable>
      </View>

      {currencyOpen && (
        <View style={styles.currencyOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCurrencyOpen(false)}
          />
          <View style={styles.currencySheet}>
            <Text style={styles.sheetTitle}>Select currency</Text>

            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <>
                  {supportedCurrencyOptions.map((option) => {
                    const selected = field.value === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        style={styles.currencyOption}
                        onPress={() => {
                          field.onChange(option.value);
                          setCurrencyOpen(false);
                        }}
                      >
                        <Text style={styles.currencyOptionText}>
                          {option.label}
                        </Text>
                        {selected && (
                          <Check size={18} color="#1789E8" />
                        )}
                      </Pressable>
                    );
                  })}
                </>
              )}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 30,
  },
  fields: { gap: 20 },
  field: { gap: 8 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#607C9B',
    marginLeft: 3,
  },
  costRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  costField: { flex: 1 },
  currencyWrapper: { width: 104, paddingTop: 22 },
  currencyButton: {
    height: 50,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#DCEAF5',
    borderRadius: 12,
    backgroundColor: '#F8FBFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currencyValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17365A',
  },
  scanSection: {
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: 1,
    borderTopColor: '#EDF3F8',
    gap: 12,
  },
  scanSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102C4B',
  },
  scanSectionDescription: {
    fontSize: 13,
    color: '#607C9B',
    marginBottom: 3,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: '#E8F4FC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#102C4B',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EDF3F8',
  },
  submitButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#FFD23F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: { opacity: 0.5 },
  submitText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102C4B',
  },
  currencyOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16,44,75,0.18)',
  },
  currencySheet: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102C4B',
    marginBottom: 12,
  },
  currencyOption: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF3F8',
  },
  currencyOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#17365A',
  },
});
