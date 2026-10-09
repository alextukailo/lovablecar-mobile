
import { router, useLocalSearchParams } from 'expo-router';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import CarForm from '../../features/cars/components/CarForm';
import type { CarFormValues } from '../../features/cars/schemas/car.schema';
import { useCarStore } from '../../store/car.store';

export default function EditCarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const car = useCarStore((state) =>
    state.cars.find((item) => item.id === id),
  );

  const updateCar = useCarStore((state) => state.updateCar);

  if (!car) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>Car not found</Text>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const handleUpdate = (values: CarFormValues) => {
    updateCar(car.id, {
      make: values.make.trim(),
      model: values.model.trim(),
      year: Number(values.year),
      engine: values.engine.trim() || undefined,
      mileage: Number(values.mileage),
      vin: values.vin.trim().toUpperCase() || undefined,
      licensePlate: values.licensePlate.trim() || undefined,
    });

    router.back();
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
        key={car.id}
        defaultValues={{
          make: car.make,
          model: car.model,
          year: String(car.year),
          engine: car.engine ?? '',
          mileage: String(car.mileage),
          vin: car.vin ?? '',
          licensePlate: car.licensePlate ?? '',
        }}
        submitLabel="Save changes"
        onSubmit={handleUpdate}
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
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#F7F7F5',
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171717',
  },
});
