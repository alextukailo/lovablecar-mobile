
import { router } from 'expo-router';
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

export default function NewCarScreen() {
  const addCar = useCarStore((state) => state.addCar);

  const handleCreate = (values: CarFormValues) => {
    addCar({
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
        submitLabel="Add car"
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
