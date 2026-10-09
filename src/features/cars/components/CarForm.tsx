
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import FormField from '../../../components/forms/FormField';
import {
    carSchema,
    emptyCarFormValues,
    type CarFormValues,
} from '../schemas/car.schema';

interface CarFormProps {
  defaultValues?: CarFormValues;
  submitLabel: string;
  onSubmit: (values: CarFormValues) => void;
}

export default function CarForm({
  defaultValues,
  submitLabel,
  onSubmit,
}: CarFormProps) {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: defaultValues ?? emptyCarFormValues,
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
          Enter your vehicle information
        </Text>
      </View>

      <View style={styles.fields}>
        <FormField
          control={control}
          name="make"
          label="Make"
          placeholder="Volkswagen"
        />

        <FormField
          control={control}
          name="model"
          label="Model"
          placeholder="Tiguan"
        />

        <FormField
          control={control}
          name="year"
          label="Year"
          placeholder="2017"
          keyboardType="number-pad"
        />

        <FormField
          control={control}
          name="engine"
          label="Engine"
          placeholder="2.0 TSI"
        />

        <FormField
          control={control}
          name="mileage"
          label="Current mileage (km)"
          placeholder="128450"
          keyboardType="number-pad"
        />

        <FormField
          control={control}
          name="vin"
          label="VIN (optional)"
          placeholder="17-character VIN"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={17}
        />

        <FormField
          control={control}
          name="licensePlate"
          label="License plate (optional)"
          placeholder="e.g. 1234 AB-7"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
        />
      </View>

      <Pressable
        onPress={submit}
        disabled={isSubmitting || !isDirty}
        style={[
          styles.submitButton,
          (isSubmitting || !isDirty) && styles.disabledButton,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#171717" />
        ) : (
          <Text style={styles.submitText}>{submitLabel}</Text>
        )}
      </Pressable>
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
});
