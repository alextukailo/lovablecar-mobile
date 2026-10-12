
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
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { api } from '../../../lib/api';
import { useCar } from '../../features/cars/hooks/useCars';

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

function firstParam(value?: string | string[]) {
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

async function deleteService(
  carId: string,
  serviceId: string,
): Promise<void> {
  await api.delete(
    `/cars/${carId}/services/${serviceId}`,
  );
}

function formatDate(value: string) {
  const parsed = new Date(
    `${value.slice(0, 10)}T00:00:00`,
  );

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatCost(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined) {
    return 'Not specified';
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 'Not specified';
  }

  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ServiceDetailsScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    carId?: string | string[];
    vehicleId?: string | string[];
  }>();

  const serviceId = firstParam(params.id);

  const carId =
    firstParam(params.carId) ??
    firstParam(params.vehicleId);

  const queryClient = useQueryClient();

  const serviceQuery = useQuery({
    queryKey: ['cars', carId, 'services', serviceId],
    queryFn: () => fetchService(carId!, serviceId!),
    enabled: Boolean(carId && serviceId),
  });

  const service = serviceQuery.data;

  const carQuery = useCar(carId);

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!carId || !serviceId) {
        throw new Error('Missing car or service ID');
      }

      return deleteService(carId, serviceId);
    },

    onSuccess: async () => {
      queryClient.removeQueries({
        queryKey: [
          'cars',
          carId,
          'services',
          serviceId,
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: ['cars', carId, 'services'],
      });
    },
  });

  const handleDelete = () => {
    if (!service || deleteMutation.isPending) {
      return;
    }

    Alert.alert(
      'Delete service record?',
      `Delete "${service.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync();

              router.replace({
                pathname: '/car/[id]',
                params: { id: service.carId },
              });
            } catch (error) {
              Alert.alert(
                'Could not delete service',
                error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred.',
              );
            }
          },
        },
      ],
    );
  };

  if (!carId || !serviceId) {
    return (
      <EmptyState
        title="Missing service information"
        description="Open a service record from its car's service history."
      />
    );
  }

  if (serviceQuery.isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator
          size="large"
          color="#F5C400"
        />

        <Text style={styles.emptyDescription}>
          Loading service...
        </Text>
      </View>
    );
  }

  if (serviceQuery.isError) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          Could not load service
        </Text>

        <Text style={styles.emptyDescription}>
          {serviceQuery.error instanceof Error
            ? serviceQuery.error.message
            : 'Please check your connection.'}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => void serviceQuery.refetch()}
        >
          <Text style={styles.primaryButtonText}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!service) {
    return (
      <EmptyState
        title="Service not found"
        description="This service may have been deleted."
      />
    );
  }

  const car = carQuery.data;

  const costText =
    service.cost === null ||
    service.cost === undefined
      ? 'Not specified'
      : `${formatCost(service.cost)} ${
          service.currency || 'BYN'
        }`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          SERVICE RECORD
        </Text>

        <Text style={styles.title}>
          {service.title}
        </Text>

        <Text style={styles.date}>
          {formatDate(service.date)}
        </Text>
      </View>

      <View style={styles.costCard}>
        <Text style={styles.costLabel}>
          TOTAL COST
        </Text>

        <Text style={styles.costValue}>
          {costText}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        VEHICLE
      </Text>

      <View style={styles.infoCard}>
        <InfoRow
          label="Car"
          value={
            car
              ? `${car.make} ${car.model}`
              : carQuery.isLoading
                ? 'Loading...'
                : 'Car unavailable'
          }
        />

        {car && (
          <InfoRow
            label="Year"
            value={String(car.year)}
          />
        )}

        <InfoRow
          label="Mileage at service"
          value={`${service.mileage.toLocaleString()} km`}
          last
        />
      </View>

      <Text style={styles.sectionTitle}>
        SERVICE DETAILS
      </Text>

      <View style={styles.infoCard}>
        <InfoRow
          label="Service"
          value={service.title}
        />

        <InfoRow
          label="Date"
          value={formatDate(service.date)}
        />

        <InfoRow
          label="Mileage"
          value={`${service.mileage.toLocaleString()} km`}
        />

        <InfoRow
          label="Cost"
          value={costText}
        />

        <InfoRow
          label="Workshop"
          value={service.workshop || '—'}
          last={!service.description}
        />

        {service.description ? (
          <InfoRow
            label="Description"
            value={service.description}
            last
          />
        ) : null}
      </View>

      <Pressable
        style={styles.editButton}
        onPress={() =>
          router.push({
            pathname: '/service/edit',
            params: {
              id: service.id,
              carId: service.carId,
            },
          })
        }
      >
        <Text style={styles.editButtonText}>
          Edit service
        </Text>
      </Pressable>

      <Pressable
        style={styles.deleteButton}
        onPress={handleDelete}
        disabled={deleteMutation.isPending}
      >
        <Text style={styles.deleteButtonText}>
          {deleteMutation.isPending
            ? 'Deleting service...'
            : 'Delete service'}
        </Text>
      </Pressable>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {title}
      </Text>

      <Text style={styles.emptyDescription}>
        {description}
      </Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.replace('/(tabs)/cars')}
      >
        <Text style={styles.primaryButtonText}>
          Back to cars
        </Text>
      </Pressable>
    </View>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        last && styles.infoRowLast,
      ]}
    >
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },
  content: {
    padding: 20,
    paddingTop: 24,
  },
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#737373',
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#171717',
    marginTop: 8,
  },
  date: {
    fontSize: 14,
    color: '#737373',
    marginTop: 6,
  },
  costCard: {
    backgroundColor: '#171717',
    borderRadius: 20,
    padding: 22,
  },
  costLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#A3A3A3',
  },
  costValue: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#737373',
    marginTop: 28,
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  infoRow: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    color: '#737373',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
    flexShrink: 1,
    textAlign: 'right',
  },
  editButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F5C400',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
  },
  deleteButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#171717',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#737373',
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  primaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 15,
    backgroundColor: '#F5C400',
    borderRadius: 14,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
  },
  bottomSpace: {
    height: 30,
  },
});
