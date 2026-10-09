
import * as ImagePicker from 'expo-image-picker';
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

import ServiceForm from '../../features/services/components/ServiceForm';
import {
    createEmptyServiceFormValues,
    type ServiceFormValues,
} from '../../features/services/schemas/service.schema';
import { useCarStore } from '../../store/car.store';
import { useServiceStore } from '../../store/service.store';

export default function NewServiceScreen() {
  const selectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectedCar = useCarStore((state) =>
    state.cars.find((car) => car.id === state.selectedCarId),
  );

  const updateCar = useCarStore(
    (state) => state.updateCar,
  );

  const addService = useServiceStore(
    (state) => state.addService,
  );

  const [isOpeningGallery, setIsOpeningGallery] =
    useState(false);

  const handleCreate = (values: ServiceFormValues) => {
    if (!selectedCarId) {
      Alert.alert(
        'No car selected',
        'Add or select a car before recording a service.',
      );
      return;
    }

    const mileage = Number(values.mileage);
    const totalCost = Number(
      values.totalCost.replace(',', '.'),
    );

    addService({
      vehicleId: selectedCarId,
      date: values.date,
      mileage,
      serviceName: values.serviceName.trim(),
      totalCost,
      currency: values.currency,
      workshop: values.workshop.trim() || undefined,
    });

    if (selectedCar && mileage > selectedCar.mileage) {
      updateCar(selectedCarId, { mileage });
    }

    router.replace('/(tabs)/services');
  };

  const handleChooseDocument = async () => {
    if (isOpeningGallery) {
      return;
    }

    setIsOpeningGallery(true);

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Allow photo library access to select a service document.',
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.9,
        });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      router.push({
        pathname: '/scanner/processing',
        params: {
          uri: result.assets[0].uri,
        },
      });
    } catch {
      Alert.alert(
        'Unable to open gallery',
        'Please try again.',
      );
    } finally {
      setIsOpeningGallery(false);
    }
  };

  if (!selectedCarId || !selectedCar) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>
          Select a car first
        </Text>

        <Text style={styles.emptyDescription}>
          A service record must belong to a vehicle.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/car/new')}
        >
          <Text style={styles.buttonText}>Add car</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.carHeader}>
        <Text style={styles.carLabel}>Service for</Text>
        <Text style={styles.carName}>
          {selectedCar.make} {selectedCar.model}
        </Text>
      </View>

      <ServiceForm
        key={selectedCarId}
        defaultValues={createEmptyServiceFormValues(
          String(selectedCar.mileage),
        )}
        submitLabel="Save service"
        onSubmit={handleCreate}
        onScanDocument={() => router.push('/scanner')}
        onChooseDocument={handleChooseDocument}
      />

      {isOpeningGallery && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>
            Opening gallery...
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },
  carHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  carLabel: {
    fontSize: 13,
    color: '#737373',
  },
  carName: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F7F7F5',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#171717',
  },
  emptyDescription: {
    marginTop: 8,
    marginBottom: 20,
    fontSize: 15,
    textAlign: 'center',
    color: '#737373',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5C400',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  loadingText: {
    textAlign: 'center',
    color: '#404040',
  },
});
