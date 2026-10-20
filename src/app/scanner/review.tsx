import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
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
import { useCars } from '../../features/cars/hooks/useCars';
import ServiceForm from '../../features/services/components/ServiceForm';
import {
    createEmptyServiceFormValues,
    getLocalDateString,
    type ServiceFormValues,
} from '../../features/services/schemas/service.schema';
import { useCarStore } from '../../store/car.store';

const SUPPORTED_CURRENCIES = [
  'BYN',
  'USD',
  'EUR',
  'PLN',
  'GBP',
  'RUB',
] as const;

type SupportedCurrency =
  (typeof SUPPORTED_CURRENCIES)[number];

function getParam(
  value?: string | string[],
): string {
  return Array.isArray(value)
    ? value[0] ?? ''
    : value ?? '';
}

function isSupportedCurrency(
  value: string,
): value is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(
    value as SupportedCurrency,
  );
}

interface CreateServicePayload {
  date: string;
  mileage: number;
  title: string;
  cost: string;
  currency: string;
  workshop?: string;
}

export default function ScannerReviewScreen() {
  const params = useLocalSearchParams<{
    uri?: string | string[];
    vehicleId?: string | string[];
    date?: string | string[];
    mileage?: string | string[];
    serviceName?: string | string[];
    totalCost?: string | string[];
    currency?: string | string[];
    workshop?: string | string[];
  }>();

  const uri = getParam(params.uri);
  const requestedVehicleId = getParam(
    params.vehicleId,
  );

  const date = getParam(params.date);
  const mileage = getParam(params.mileage);
  const serviceName = getParam(
    params.serviceName,
  );
  const totalCost = getParam(params.totalCost);
  const currency = getParam(params.currency);
  const workshop = getParam(params.workshop);

  const queryClient = useQueryClient();

  const selectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  const {
    data: cars = [],
    isLoading,
    isError,
    refetch,
  } = useCars();

  // Prefer the car explicitly passed through OCR.
  // Validate both IDs against PostgreSQL data.
  const car = useMemo(() => {
    const requestedCar = cars.find(
      (item) =>
        item.id === requestedVehicleId,
    );

    const storedCar = cars.find(
      (item) => item.id === selectedCarId,
    );

    return (
      requestedCar ??
      storedCar ??
      cars.find((item) => item.isPrimary) ??
      cars[0] ??
      null
    );
  }, [
    cars,
    requestedVehicleId,
    selectedCarId,
  ]);

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

  const defaultValues = useMemo<ServiceFormValues>(
    () => ({
      ...createEmptyServiceFormValues(),
      date: date || getLocalDateString(),
      mileage:
        mileage ||
        (car ? String(car.mileage) : ''),
      serviceName,
      totalCost,
      currency: isSupportedCurrency(currency)
        ? currency
        : 'BYN',
      workshop,
    }),
    [
      date,
      mileage,
      serviceName,
      totalCost,
      currency,
      workshop,
      car?.id,
      car?.mileage,
    ],
  );

  const handleSubmit = async (
    values: ServiceFormValues,
  ) => {
    if (!car) {
      Alert.alert(
        'Car not found',
        'Please select a car before saving this service.',
      );
      return;
    }

    const parsedMileage = Number(
      values.mileage,
    );

    const parsedCost = Number(
      values.totalCost.replace(',', '.'),
    );

    if (
      !Number.isInteger(parsedMileage) ||
      parsedMileage < 0
    ) {
      Alert.alert(
        'Invalid mileage',
        'Please enter a valid mileage.',
      );
      return;
    }

    if (
      !Number.isFinite(parsedCost) ||
      parsedCost < 0
    ) {
      Alert.alert(
        'Invalid cost',
        'Please enter a valid service cost.',
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
        carId: car.id,
        payload: {
          date: parsedDate.toISOString(),
          mileage: parsedMileage,
          title,
          cost: parsedCost.toFixed(2),
          currency: values.currency,
          workshop:
            values.workshop.trim() ||
            undefined,
        },
      });

      // Keep the car selected across screens.
      // Zustand stores only its PostgreSQL ID.
      selectCar(car.id);

      router.replace('/(tabs)/services');
    } catch (error) {
      console.error(
        'Failed to save scanned service:',
        error,
      );

      Alert.alert(
        'Unable to save service',
        'The service was not saved. Please check your connection and try again.',
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          size="large"
          color="#246BFD"
        />

        <Text style={styles.description}>
          Loading car information...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>
          Unable to load cars
        </Text>

        <Text style={styles.description}>
          Please check your connection.
        </Text>

        <Pressable
          onPress={() => void refetch()}
        >
          <Text style={styles.link}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!car) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>
          Car not found
        </Text>

        <Text style={styles.description}>
          Return to your cars list and select
          the vehicle for this service.
        </Text>

        <Text
          style={styles.link}
          onPress={() =>
            router.replace('/(tabs)/cars')
          }
        >
          Go to cars
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator
        nestedScrollEnabled
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Review service details
          </Text>

          <Text style={styles.description}>
            Check the recognized values and correct
            anything that is missing or inaccurate.
            Nothing is saved until you confirm.
          </Text>
        </View>

        <View style={styles.carCard}>
          <Text style={styles.carLabel}>
            SERVICE FOR
          </Text>

          <Text style={styles.carName}>
            {car.make} {car.model} ({car.year})
          </Text>

          <Text style={styles.carMileage}>
            Current mileage:{' '}
            {car.mileage.toLocaleString()} km
          </Text>
        </View>

        <ServiceForm
          key={`${car.id}:${uri}`}
          defaultValues={defaultValues}
          submitLabel={
            createService.isPending
              ? 'Saving service...'
              : 'Confirm and save service'
          }
          onSubmit={handleSubmit}
        />

        {uri ? (
          <Text style={styles.documentNote}>
            The scanned document was used to
            extract these values. The image itself
            is not yet uploaded or attached to
            the PostgreSQL service record.
          </Text>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },

  header: {
    marginBottom: 20,
  },

  title: {
    color: '#252A34',
    fontSize: 25,
    fontWeight: '800',
  },

  description: {
    color: '#737B89',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },

  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
  },

  carLabel: {
    color: '#737B89',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  carName: {
    color: '#252A34',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 6,
  },

  carMileage: {
    color: '#737B89',
    fontSize: 13,
    marginTop: 5,
  },

  documentNote: {
    color: '#737B89',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    marginBottom: 20,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6F8',
    padding: 24,
  },

  link: {
    color: '#246BFD',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
  },
});
