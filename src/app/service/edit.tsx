
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { api } from '../../../lib/api';
import { useCar } from '../../features/cars/hooks/useCars';
import ServiceForm from '../../features/services/components/ServiceForm';
import {
    createEmptyServiceFormValues,
    type ServiceFormValues,
} from '../../features/services/schemas/service.schema';

interface ApiServiceRecord {
  id: string;
  carId: string;
  date: string;
  mileage: number;
  title: string;
  description?: string | null;
  cost?: string | number | null;
  currency: string;
  workshop?: string | null;
  createdAt: string;
}

interface UpdateServicePayload {
  date: string;
  mileage: number;
  title: string;
  cost: string;
  currency: string;
  workshop: string;
}

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function fetchService(
  carId: string,
  serviceId: string,
): Promise<ApiServiceRecord> {
  const response = await api.get<ApiServiceRecord>(
    `/cars/${carId}/services/${serviceId}`,
  );

  return response.data;
}

async function updateService(
  carId: string,
  serviceId: string,
  data: UpdateServicePayload,
): Promise<ApiServiceRecord> {
  const response = await api.patch<ApiServiceRecord>(
    `/cars/${carId}/services/${serviceId}`,
    data,
  );

  return response.data;
}

function isSupportedCurrency(
  currency: string,
): currency is ServiceFormValues['currency'] {
  return [
    'BYN',
    'USD',
    'EUR',
    'PLN',
    'GBP',
    'RUB',
  ].includes(currency);
}

function getDefaultValues(
  service: ApiServiceRecord,
): ServiceFormValues {
  return {
    ...createEmptyServiceFormValues(),
    date: service.date.slice(0, 10),
    mileage: String(service.mileage),
    serviceName: service.title,
    totalCost:
      service.cost === null ||
      service.cost === undefined
        ? '0'
        : String(service.cost),
    currency: isSupportedCurrency(service.currency)
      ? service.currency
      : 'BYN',
    workshop: service.workshop ?? '',
  };
}

export default function EditServiceScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    carId?: string | string[];
  }>();

  const serviceId = firstParam(params.id);
  const carId = firstParam(params.carId);

  const queryClient = useQueryClient();

  const {
    data: service,
    isLoading: serviceLoading,
    isError: serviceError,
    error: serviceErrorDetails,
    refetch: refetchService,
  } = useQuery({
    queryKey: [
      'cars',
      carId,
      'services',
      serviceId,
    ],
    queryFn: () =>
      fetchService(carId!, serviceId!),
    enabled: Boolean(carId && serviceId),
  });

  const {
    data: car,
    isLoading: carLoading,
    isError: carError,
    refetch: refetchCar,
  } = useCar(carId);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateServicePayload) => {
      if (!carId || !serviceId) {
        throw new Error(
          'Missing car or service ID',
        );
      }

      return updateService(
        carId,
        serviceId,
        data,
      );
    },

    onSuccess: async (updatedService) => {
      queryClient.setQueryData(
        [
          'cars',
          carId,
          'services',
          serviceId,
        ],
        updatedService,
      );

      await queryClient.invalidateQueries({
        queryKey: [
          'cars',
          carId,
          'services',
        ],
      });
    },
  });

  const handleSubmit = async (
    values: ServiceFormValues,
  ) => {
    if (
      !service ||
      !carId ||
      !serviceId ||
      updateMutation.isPending
    ) {
      return;
    }

    const mileage = Number(values.mileage);

    const normalizedCost = values.totalCost
      .trim()
      .replace(',', '.');

    const cost = Number(normalizedCost);

    if (
      !Number.isSafeInteger(mileage) ||
      mileage < 0
    ) {
      Alert.alert(
        'Invalid mileage',
        'Please enter a valid mileage.',
      );
      return;
    }

    if (
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      Alert.alert(
        'Invalid cost',
        'Please enter a valid service cost.',
      );
      return;
    }

    try {
      await updateMutation.mutateAsync({
        date: `${values.date}T00:00:00.000Z`,
        mileage,
        title: values.serviceName.trim(),
        cost: normalizedCost,
        currency: values.currency,
        workshop: values.workshop.trim(),
      });

      router.replace({
        pathname: '/service/[id]',
        params: {
          id: serviceId,
          carId,
        },
      });
    } catch (error) {
      Alert.alert(
        'Could not update service',
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.',
      );
    }
  };

  if (!carId || !serviceId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>
          Missing service information
        </Text>

        <Text style={styles.description}>
          Open the service record from
          your car's service history.
        </Text>

        <Pressable
          onPress={() =>
            router.replace('/(tabs)/cars')
          }
        >
          <Text style={styles.link}>
            Back to cars
          </Text>
        </Pressable>
      </View>
    );
  }

  if (serviceLoading || carLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          size="large"
          color="#246BFD"
        />

        <Text style={styles.description}>
          Loading service...
        </Text>
      </View>
    );
  }

  if (serviceError || carError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>
          Could not load service
        </Text>

        <Text style={styles.description}>
          {serviceErrorDetails instanceof Error
            ? serviceErrorDetails.message
            : 'Please check your connection to the backend.'}
        </Text>

        <Pressable
          onPress={() => {
            void refetchService();
            void refetchCar();
          }}
        >
          <Text style={styles.link}>
            Try again
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.replace({
              pathname: '/car/[id]',
              params: { id: carId },
            })
          }
        >
          <Text style={styles.link}>
            Back to car
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!service || !car) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>
          Service not found
        </Text>

        <Text style={styles.description}>
          This service record or its
          associated car is unavailable.
        </Text>

        <Pressable
          onPress={() =>
            router.replace({
              pathname: '/car/[id]',
              params: { id: carId },
            })
          }
        >
          <Text style={styles.link}>
            Back to car
          </Text>
        </Pressable>
      </View>
    );
  }

  const defaultValues = getDefaultValues(service);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Edit service
        </Text>

        <Text style={styles.description}>
          {car.make} {car.model} · {car.year}
        </Text>
      </View>

      <ServiceForm
        key={service.id}
        defaultValues={defaultValues}
        submitLabel={
          updateMutation.isPending
            ? 'Saving changes...'
            : 'Save changes'
        }
        onSubmit={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: '#252A34',
    fontSize: 26,
    fontWeight: '800',
  },
  description: {
    color: '#737B89',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
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
    fontWeight: '700',
    marginTop: 16,
  },
});
