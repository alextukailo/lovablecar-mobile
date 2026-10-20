
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CalendarDays,
    CarFront,
    Cog, Gauge,
    Hash, IdCard, Tag,
} from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import {
    ActivityIndicator, Pressable, ScrollView,
    StyleSheet, Text, View,
} from 'react-native';

import FormField from '@/shared/ui/forms/FormField';
import {
    carSchema,
    emptyCarFormValues,
    type CarFormValues,
} from '../model/car.schema';

interface CarFormProps {
  defaultValues?: CarFormValues;
  submitLabel: string;
  onSubmit: (values: CarFormValues) => void | Promise<void>;
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <CarFront size={22} color="#1789E8" />
          </View>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Vehicle details</Text>
            <Text style={styles.introSubtitle}>
              Keep your vehicle information up to date
            </Text>
          </View>
        </View>

        <View style={styles.fields}>
          <FormField
            control={control}
            name="make"
            label="Make"
            placeholder="e.g. Volkswagen"
            icon={CarFront}
          />
          <FormField
            control={control}
            name="model"
            label="Model"
            placeholder="e.g. Tiguan"
            icon={Tag}
          />
          <FormField
            control={control}
            name="year"
            label="Year"
            placeholder="e.g. 2017"
            keyboardType="number-pad"
            icon={CalendarDays}
          />
          <FormField
            control={control}
            name="engine"
            label="Engine"
            placeholder="e.g. 2.0 TSI"
            icon={Cog}
          />
          <FormField
            control={control}
            name="mileage"
            label="Current mileage (km)"
            placeholder="e.g. 128500"
            keyboardType="number-pad"
            icon={Gauge}
          />
          <FormField
            control={control}
            name="vin"
            label="VIN (optional)"
            placeholder="17-character VIN"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={17}
            icon={Hash}
          />
          <FormField
            control={control}
            name="licensePlate"
            label="License plate (optional)"
            placeholder="e.g. 1234 AB-4"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={20}
            icon={IdCard}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSubmit(async (values) => {
            await onSubmit(values);
          })}
          disabled={isSubmitting || !isDirty}
          style={[
            styles.submitButton,
            (isSubmitting || !isDirty) && styles.disabledButton,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#102C4B" />
          ) : (
            <Text style={styles.submitText}>{submitLabel}</Text>
          )}
        </Pressable>
      </View>
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
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 26,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#EFF8FF',
  },
  introIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#DDF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { flex: 1 },
  introTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102C4B',
  },
  introSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#607C9B',
  },
  fields: { gap: 20 },
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
});
