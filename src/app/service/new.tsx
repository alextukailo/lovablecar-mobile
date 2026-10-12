
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { api } from '../../../lib/api';
import {
    useCar,
    useCars,
} from '../../features/cars/hooks/useCars';
import ServiceForm from '../../features/services/components/ServiceForm';
import {
    createEmptyServiceFormValues,
    type ServiceFormValues,
} from '../../features/services/schemas/service.schema';
import { useCarStore } from '../../store/car.store';

interface CreateServicePayload {
  date: string;
  mileage: number;
  title: string;
  cost: string;
  currency: string;
  workshop?: string;
}

export default function ServiceNewScreen() {
  const params = useLocalSearchParams<{
    vehicleId?: string | string[];
  }>();

  const queryClient = useQueryClient();

  const [isChoosingDocument, setIsChoosingDocument] =
    useState(false);

  const storedSelectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  const routeVehicleId = Array.isArray(params.vehicleId)
    ? params.vehicleId[0]
    : params.vehicleId;

  const {
    data: cars = [],
    isLoading: isLoadingCars,
    isError: isCarsError,
    refetch: refetchCars,
  } = useCars();

  // Only use IDs that belong to cars returned
  // by the PostgreSQL backend.
  const routeCar = cars.find(
    (item) => item.id === routeVehicleId,
  );

  const storedCar = cars.find(
    (item) => item.id === storedSelectedCarId,
  );

  const primaryCar = cars.find(
    (item) => item.isPrimary,
  );

  const resolvedCar =
    routeCar ??
    storedCar ??
    primaryCar ??
    cars[0] ??
    null;

  const vehicleId = resolvedCar?.id;

  const {
    data: car,
    isLoading: isLoadingCar,
    isError: isCarError,
    refetch: refetchCar,
  } = useCar(vehicleId);

  const createService = useMutation({
    mutationFn: async ({
      carId,
      payload,
    }: {
      carId: string;
      payload: CreateServicePayload;
    }) => {
      const response = await api.post(
        `/cars/${carId}/services`,
        payload,
      );

      return response.data;
    },

    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [
          'cars',
          variables.carId,
          'services',
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: ['cars'],
      });
    },
  });

  const handleCreate = async (
    values: ServiceFormValues,
  ) => {
    if (!car || !vehicleId) {
      Alert.alert(
        'Car not found',
        'Please select an existing car before adding a service.',
      );
      return;
    }

    const mileage = Number(values.mileage);
    const cost = Number(
      values.totalCost.replace(',', '.'),
    );

    if (
      !Number.isInteger(mileage) ||
      mileage < 0 ||
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      Alert.alert(
        'Invalid details',
        'Please check the mileage and service cost.',
      );
      return;
    }

    const title = values.serviceName.trim();

    if (!title) {
      Alert.alert(
        'Missing service',
        'Please enter a service name.',
      );
      return;
    }

    const parsedDate = new Date(
      `${values.date}T12:00:00`,
    );

    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert(
        'Invalid date',
        'Please enter a valid service date.',
      );
      return;
    }

    try {
      await createService.mutateAsync({
        carId: vehicleId,
        payload: {
          date: parsedDate.toISOString(),
          mileage,
          title,
          cost: cost.toFixed(2),
          currency: values.currency,
          workshop:
            values.workshop.trim() || undefined,
        },
      });

      // Store only the selected PostgreSQL ID.
      // The actual car data remains on the server.
      selectCar(vehicleId);

      router.replace('/(tabs)/services');
    } catch (error) {
      console.error(
        'Failed to create service:',
        error,
      );

      Alert.alert(
        'Unable to save service',
        'The service was not saved. Please check your connection and try again.',
      );
    }
  };

  const handleChooseDocument = async () => {
    if (isChoosingDocument) {
      return;
    }

    if (!vehicleId) {
      Alert.alert(
        'No car selected',
        'Please select a car before scanning a document.',
      );
      return;
    }

    setIsChoosingDocument(true);

    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1,
        });

      if (
        result.canceled ||
        !result.assets[0]?.uri
      ) {
        return;
      }

      // Keep the selected car consistent
      // when entering the scanner flow.
      selectCar(vehicleId);

      router.push({
        pathname: '/scanner/processing',
        params: {
          uri: result.assets[0].uri,
          vehicleId,
        },
      });
    } catch (error) {
      console.error(
        'Failed to select document:',
        error,
      );

      Alert.alert(
        'Unable to select document',
        'Please try selecting the image again.',
      );
    } finally {
      setIsChoosingDocument(false);
    }
  };

  const handleScanDocument = () => {
    if (!vehicleId) {
      return;
    }

    selectCar(vehicleId);

    router.push({
      pathname: '/scanner',
      params: {
        vehicleId,
      },
    });
  };

  if (isLoadingCars || (vehicleId && isLoadingCar)) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator
          size="large"
          color="#F5C400"
        />

        <Text style={styles.emptyText}>
          Loading your car...
        </Text>
      </View>
    );
  }

  if (isCarsError || isCarError) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          Unable to load car
        </Text>

        <Text style={styles.emptyText}>
          Please check your connection and try again.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            void refetchCars();

            if (vehicleId) {
              void refetchCar();
            }
          }}
        >
          <Text style={styles.primaryButtonText}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!car || !vehicleId) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          No car selected
        </Text>

        <Text style={styles.emptyText}>
          Add a car or select an existing one before
          recording a service.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/car/new')}
        >
          <Text style={styles.primaryButtonText}>
            Add a car
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.carCard}>
          <Text style={styles.carCardLabel}>
            SERVICE FOR
          </Text>

          <Text style={styles.carName}>
            {car.make} {car.model}
          </Text>

          <Text style={styles.carDetails}>
            {car.year}
            {car.engine
              ? ` · ${car.engine}`
              : ''}
            {' · '}
            {car.mileage.toLocaleString()} km
          </Text>
        </View>

        <Text style={styles.heading}>
          Add service record
        </Text>

        <Text style={styles.description}>
          Record maintenance or scan a service
          document to add its details.
        </Text>

        <ServiceForm
          key={car.id}
          defaultValues={
            createEmptyServiceFormValues(
              String(car.mileage),
            )
          }
          submitLabel={
            createService.isPending
              ? 'Saving service...'
              : 'Save service'
          }
          onSubmit={handleCreate}
          onScanDocument={handleScanDocument}
          onChooseDocument={
            handleChooseDocument
          }
        />

        {isChoosingDocument && (
          <Text style={styles.loadingText}>
            Opening photo library…
          </Text>
        )}

        {createService.isPending && (
          <View style={styles.savingContainer}>
            <ActivityIndicator
              color="#F5C400"
            />

            <Text style={styles.loadingText}>
              Saving to PostgreSQL...
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  carCard: {
    backgroundColor: '#171717',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },

  carCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#A3A3A3',
  },

  carName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },

  carDetails: {
    fontSize: 13,
    color: '#D4D4D4',
    marginTop: 5,
  },

  heading: {
    fontSize: 25,
    fontWeight: '800',
    color: '#171717',
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#737373',
    marginTop: 8,
    marginBottom: 20,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F7F7F5',
  },

  emptyTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#171717',
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#737373',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
  },

  primaryButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: '#F5C400',
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },

  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginTop: 4,
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#525252',
  },

  loadingText: {
    fontSize: 13,
    color: '#737373',
    textAlign: 'center',
    marginTop: 12,
  },

  savingContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
});
