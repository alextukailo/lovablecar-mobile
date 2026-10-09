
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
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
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>{submitLabel}</Text>
        <Text style={styles.subtitle}>
          Enter the details of your vehicle service
        </Text>
      </View>

      <View style={styles.fields}>
        <FormField
          control={control}
          name="date"
          label="Service date"
          placeholder="YYYY-MM-DD"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FormField
          control={control}
          name="mileage"
          label="Mileage (km)"
          placeholder="128450"
          keyboardType="number-pad"
        />

        <FormField
          control={control}
          name="serviceName"
          label="Service"
          placeholder="Engine oil change"
        />

        <View style={styles.field}>
          <Text style={styles.label}>Cost</Text>

          <Controller
            control={control}
            name="totalCost"
            render={({ field, fieldState }) => (
              <>
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="120.00"
                  placeholderTextColor="#A3A3A3"
                  keyboardType="decimal-pad"
                  accessibilityLabel="Service cost"
                  style={[
                    styles.input,
                    fieldState.error && styles.inputError,
                  ]}
                />
                <FormError message={fieldState.error?.message} />
              </>
            )}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Currency</Text>

          <Controller
            control={control}
            name="currency"
            render={({ field, fieldState }) => (
              <>
                <View style={styles.currencyRow}>
                  {supportedCurrencyOptions.map((option) => {
                    const selected = field.value === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => field.onChange(option.value)}
                        style={[
                          styles.currencyOption,
                          selected && styles.currencyOptionSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.currencyText,
                            selected && styles.currencyTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <FormError message={fieldState.error?.message} />
              </>
            )}
          />
        </View>

        <FormField
          control={control}
          name="workshop"
          label="Workshop (optional)"
          placeholder="Auto Service Center"
        />
      </View>

      <Pressable
        onPress={submit}
        disabled={isSubmitting}
        style={[
          styles.submitButton,
          isSubmitting && styles.disabledButton,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#171717" />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </Pressable>

      {onScanDocument && (
        <Pressable
          onPress={onScanDocument}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            Scan service document
          </Text>
        </Pressable>
      )}

      {onChooseDocument && (
        <Pressable
          onPress={onChooseDocument}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>
            Choose document from gallery
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#171717',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#737373',
  },
  fields: {
    gap: 18,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#404040',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#171717',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  currencyOptionSelected: {
    backgroundColor: '#FFF4B8',
    borderColor: '#D9A900',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#525252',
  },
  currencyTextSelected: {
    color: '#171717',
  },
  submitButton: {
    minHeight: 54,
    marginTop: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5C400',
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
  },
  secondaryButton: {
    minHeight: 48,
    marginTop: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#404040',
  },
});
