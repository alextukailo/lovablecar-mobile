import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import CarForm from '../../features/cars/components/CarForm';
import { useCreateCar } from '../../features/cars/hooks/useCars';
import type { CarFormValues } from '../../features/cars/schemas/car.schema';

export default function NewCarScreen() {
  const createCarMutation = useCreateCar();
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (values: CarFormValues) => {
    if (submitting) return;

    setSubmitting(true);

    try {
      await createCarMutation.mutateAsync({
        make: values.make.trim(),
        model: values.model.trim(),
        year: Number(values.year),
        engine: values.engine.trim() || undefined,
        mileage: Number(values.mileage),
        vin: values.vin.trim().toUpperCase() || undefined,
        licensePlate: values.licensePlate.trim() || undefined,
        isPrimary: false,
      });

      router.back();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create car';

      Alert.alert('Could not add car', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>

      <CarForm
        submitLabel={submitting ? 'Adding car...' : 'Add car'}
        onSubmit={handleCreate}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  cancelText: {
    fontSize: 15,
    color: '#737373',
  },
});
