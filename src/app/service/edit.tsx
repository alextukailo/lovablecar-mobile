
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CarFront, Wrench } from 'lucide-react-native';
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
  return ['BYN', 'USD', 'EUR', 'PLN', 'GBP', 'RUB'].includes(currency);
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
      service.cost === null || service.cost === undefined
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
    queryKey: ['cars', carId, 'services', serviceId],
    queryFn: () => fetchService(carId!, serviceId!),
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
        throw new Error('Missing car or service ID');
      }
      return updateService(carId, serviceId, data);
    },
    onSuccess: async (updatedService) => {
      queryClient.setQueryData(
        ['cars', carId, 'services', serviceId],
        updatedService,
      );
      await queryClient.invalidateQueries({
        queryKey: ['cars', carId, 'services'],
      });
    },
  });

  const handleSubmit = async (values: ServiceFormValues) => {
    if (!service || !carId || !serviceId || updateMutation.isPending) {
      return;
    }

    const mileage = Number(values.mileage);
    const normalizedCost = values.totalCost.trim().replace(',', '.');
    const cost = Number(normalizedCost);

    if (!Number.isSafeInteger(mileage) || mileage < 0) {
      Alert.alert('Invalid mileage', 'Please enter a valid mileage.');
      return;
    }

    if (!Number.isFinite(cost) || cost < 0) {
      Alert.alert('Invalid cost', 'Please enter a valid service cost.');
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
        params: { id: serviceId, carId },
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
        <Wrench size={44} color="#1789E8" />
        <Text style={styles.centerTitle}>
          Missing service information
        </Text>
        <Text style={styles.centerDescription}>
          Open the service record from your car's service history.
        </Text>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.replace('/(tabs)/cars')}
        >
          <Text style={styles.actionText}>Back to Cars</Text>
        </Pressable>
      </View>
    );
  }

  if (serviceLoading || carLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1789E8" />
        <Text style={styles.centerDescription}>
          Loading service...
        </Text>
      </View>
    );
  }

  if (serviceError || carError || !service || !car) {
    return (
      <View style={styles.centered}>
        <Wrench size={44} color="#1789E8" />
        <Text style={styles.centerTitle}>
          {serviceError || carError
            ? 'Could not load service'
            : 'Service not found'}
        </Text>
        <Text style={styles.centerDescription}>
          {serviceErrorDetails instanceof Error
            ? serviceErrorDetails.message
            : 'This service record is unavailable.'}
        </Text>
        {(serviceError || carError) && (
          <Pressable
            style={styles.actionButton}
            onPress={() => {
              void refetchService();
              void refetchCar();
            }}
          >
            <Text style={styles.actionText}>Try Again</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() =>
            router.replace({
              pathname: '/car/[id]',
              params: { id: carId },
            })
          }
        >
          <Text style={styles.backText}>Back to Car</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          accessibilityLabel="Go back"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace({
                pathname: '/service/[id]',
                params: { id: serviceId, carId },
              });
            }
          }}
        >
          <ArrowLeft size={24} color="#102C4B" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Service</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.vehicleRow}>
        <CarFront size={17} color="#1789E8" />
        <Text style={styles.vehicleText} numberOfLines={1}>
          {car.make} {car.model} · {car.year}
        </Text>
      </View>

      <ServiceForm
        key={service.id}
        defaultValues={getDefaultValues(service)}
        submitLabel={
          updateMutation.isPending ? 'Saving changes...' : 'Save Changes'
        }
        onSubmit={handleSubmit}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 76,
    backgroundColor: '#DDF2FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 44,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#102C4B',
  },
  headerSpacer: { width: 40 },
  vehicleRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginTop: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#EFF8FF',
  },
  vehicleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#17365A',
  },
  centered: {
    flex: 1,
    backgroundColor: '#DDF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 14,
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102C4B',
    textAlign: 'center',
  },
  centerDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#607C9B',
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFD23F',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#102C4B',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1789E8',
    marginTop: 6,
  },
});
