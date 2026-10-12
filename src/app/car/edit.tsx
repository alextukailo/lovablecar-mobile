
import { router, useLocalSearchParams } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import CarForm from '../../features/cars/components/CarForm';
import {
    useCar,
    useUpdateCar,
} from '../../features/cars/hooks/useCars';
import type { CarFormValues } from '../../features/cars/schemas/car.schema';

export default function EditCarScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const {
    data: car,
    isLoading,
    isError,
    error,
    refetch,
  } = useCar(id);

  const updateCar = useUpdateCar();

  const handleUpdate = async (values: CarFormValues) => {
    if (!car || updateCar.isPending) {
      return;
    }

    try {
      await updateCar.mutateAsync({
        id: car.id,
        data: {
          make: values.make.trim(),
          model: values.model.trim(),
          year: Number(values.year),
          engine: values.engine.trim() || undefined,
          mileage: Number(values.mileage),
          vin: values.vin.trim().toUpperCase() || undefined,
          licensePlate: values.licensePlate.trim() || undefined,
        },
      });

      router.back();
    } catch (error) {
      Alert.alert(
        'Could not save changes',
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.',
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.notFound}>
        <ActivityIndicator size="large" color="#F5C400" />
        <Text style={styles.statusText}>
          Loading car...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>
          Could not load car
        </Text>

        <Text style={styles.statusText}>
          {error instanceof Error
            ? error.message
            : 'Please check your connection.'}
        </Text>

        <Pressable onPress={() => void refetch()}>
          <Text style={styles.actionText}>
            Try again
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>
          Car not found
        </Text>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancelText}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          disabled={updateCar.isPending}
        >
          <Text style={styles.cancelText}>
            Cancel
          </Text>
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
        submitLabel={
          updateCar.isPending
            ? 'Saving changes...'
            : 'Save changes'
        }
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
    paddingHorizontal: 24,
    backgroundColor: '#F7F7F5',
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171717',
  },
  statusText: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
  },
});
