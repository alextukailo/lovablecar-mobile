import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
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
import type { ApiMaintenanceSchedule } from '../../../lib/maintenance.api';
import { useCarMaintenanceSchedules } from '../../../lib/maintenance.queries';
import {
    useCar,
    useDeleteCar,
} from '../../features/cars/hooks/useCars';
import { calculateMaintenanceStatus } from '../../features/maintenance/utils/maintenance-status';
import { useCarStore } from '../../store/car.store';
interface ApiService {
  id: string;
  date: string;
  mileage: number;
  title: string;
  cost?: string | number | null;
  currency?: string | null;
  workshop?: string | null;
}
async function fetchCarServices(
  carId: string,
): Promise<ApiService[]> {
  const response = await api.get<ApiService[]>(
    `/cars/${carId}/services`,
  );
  return response.data;
}
const maintenanceLabels: Record<string, string> = {
  ENGINE_OIL: 'Engine oil + filter',
  TRANSMISSION_OIL: 'Transmission oil',
  BRAKE_FLUID: 'Brake fluid',
  HALDEX_OIL: 'Haldex oil',
};
function maintenanceName(
  schedule: ApiMaintenanceSchedule,
): string {
  if (schedule.type === 'CUSTOM') {
    return schedule.customTitle || 'Custom maintenance';
  }
  return (
    maintenanceLabels[schedule.type] ||
    schedule.type.replace(/_/g, ' ')
  );
}
function formatDate(date: string): string {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }
  return parsedDate.toLocaleDateString();
}
function formatCost(
  cost?: string | number | null,
): string {
  const numericCost = Number(cost ?? 0);
  return Number.isFinite(numericCost)
    ? numericCost.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })
    : '0';
}
function maintenanceInterval(
  schedule: ApiMaintenanceSchedule,
): string {
  const parts: string[] = [];
  if (schedule.intervalKm !== null) {
    parts.push(
      `${schedule.intervalKm.toLocaleString()} km`,
    );
  }
  if (schedule.intervalMonths !== null) {
    parts.push(
      `${schedule.intervalMonths} months`,
    );
  }
  return parts.length > 0
    ? parts.join(' / ')
    : 'Not configured';
}
export default function CarDetailsScreen() {
  const params = useLocalSearchParams<{
    id: string | string[];
  }>();
  const carId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;
  const selectCar = useCarStore(
    (state) => state.selectCar,
  );
  const selectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );
  const clearSelectedCar = useCarStore(
    (state) => state.clearSelectedCar,
  );
  const {
    data: car,
    isLoading: isLoadingCar,
    isError: isCarError,
    refetch: refetchCar,
  } = useCar(carId);
  const {
    data: services = [],
    isLoading: isLoadingServices,
    isError: isServicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['cars', carId, 'services'],
    queryFn: () => fetchCarServices(carId!),
    enabled: Boolean(carId) && Boolean(car),
  });
  const {
    data: maintenanceSchedules = [],
    isLoading: isLoadingMaintenance,
    isError: isMaintenanceError,
    refetch: refetchMaintenance,
  } = useCarMaintenanceSchedules(car?.id);
  const deleteCar = useDeleteCar();
  useEffect(() => {
    if (!car) {
      return;
    }
    if (selectedCarId !== car.id) {
      selectCar(car.id);
    }
  }, [car?.id, selectedCarId, selectCar]);
  const sortedServices = useMemo(
    () =>
      [...services].sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      ),
    [services],
  );
  const totalsByCurrency = useMemo(
    () =>
      sortedServices.reduce<Record<string, number>>(
        (totals, service) => {
          const currency =
            service.currency || 'Unknown';
          const cost = Number(service.cost ?? 0);
          if (Number.isFinite(cost)) {
            totals[currency] =
              (totals[currency] ?? 0) + cost;
          }
          return totals;
        },
        {},
      ),
    [sortedServices],
  );
  const maintenanceCounts = useMemo(() => {
    const counts = { overdue: 0, dueSoon: 0, upcoming: 0 };
    if (!car) return counts;

    for (const schedule of maintenanceSchedules) {
      const status = calculateMaintenanceStatus(schedule, car.mileage).status;
      if (status === 'OVERDUE') counts.overdue += 1;
      else if (status === 'DUE_SOON') counts.dueSoon += 1;
      else if (status === 'UPCOMING') counts.upcoming += 1;
    }
    return counts;
  }, [maintenanceSchedules, car?.mileage]);

  const latestService = sortedServices[0];
  const handleDelete = () => {
    if (!car || deleteCar.isPending) {
      return;
    }
    Alert.alert(
      'Delete car?',
      `Delete ${car.make} ${car.model} and its service records? This action cannot be undone.`,
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
              await deleteCar.mutateAsync(car.id);
              if (selectedCarId === car.id) {
                clearSelectedCar();
              }
              router.replace('/(tabs)/cars');
            } catch (error) {
              console.error(
                'Failed to delete car:',
                error,
              );
              Alert.alert(
                'Unable to delete car',
                'The car was not deleted. Please try again.',
              );
            }
          },
        },
      ],
    );
  };
  const openService = (serviceId: string) => {
    if (!car) {
      return;
    }
    router.push({
      pathname: '/service/[id]',
      params: {
        id: serviceId,
        vehicleId: car.id,
      },
    });
  };
  const openNewService = () => {
    if (!car) {
      return;
    }
    router.push({
      pathname: '/service/new',
      params: {
        vehicleId: car.id,
      },
    });
  };
  const openMaintenance = (scheduleId: string) => {
    if (!car) {
      return;
    }
    router.push({
      pathname: '/maintenance/[id]',
      params: {
        id: scheduleId,
        carId: car.id,
      },
    });
  };
  if (isLoadingCar) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator
          size="large"
          color="#246BFD"
        />
        <Text style={styles.emptyDescription}>
          Loading car details...
        </Text>
      </View>
    );
  }
  if (isCarError) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          Unable to load car
        </Text>
        <Text style={styles.emptyDescription}>
          Please check your connection and try again.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => void refetchCar()}
        >
          <Text style={styles.primaryButtonText}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }
  if (!car) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          Car not found
        </Text>
        <Text style={styles.emptyDescription}>
          This car may have been deleted or is no
          longer available.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.replace('/(tabs)/cars')
          }
        >
          <Text style={styles.primaryButtonText}>
            Back to cars
          </Text>
        </Pressable>
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>
            ‹ Back
          </Text>
        </Pressable>
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/car/edit',
              params: { id: car.id },
            })
          }
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>
            Edit car
          </Text>
        </Pressable>
      </View>
      <View style={styles.heroCard}>
        {car.isPrimary && (
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryBadgeText}>
              PRIMARY CAR
            </Text>
          </View>
        )}
        <Text style={styles.carTitle}>
          {car.make} {car.model}
        </Text>
        <Text style={styles.carSubtitle}>
          {car.year}
          {car.engine ? ` · ${car.engine}` : ''}
        </Text>
        <View style={styles.mileageContainer}>
          <Text style={styles.mileageLabel}>
            Current mileage
          </Text>
          <Text style={styles.mileageValue}>
            {car.mileage.toLocaleString()} km
          </Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>
        VEHICLE INFORMATION
      </Text>
      <View style={styles.infoCard}>
        <InfoRow label="Make" value={car.make} />
        <InfoRow label="Model" value={car.model} />
        <InfoRow
          label="Year"
          value={String(car.year)}
        />
        <InfoRow
          label="Engine"
          value={car.engine || 'Not specified'}
        />
        <InfoRow
          label="VIN"
          value={car.vin || 'Not specified'}
        />
        <InfoRow
          label="License plate"
          value={
            car.licensePlate || 'Not specified'
          }
          isLast
        />
      </View>
      <Text style={styles.sectionTitle}>
        MAINTENANCE SCHEDULES
      </Text>
      {!isLoadingMaintenance &&
        !isMaintenanceError &&
        maintenanceSchedules.length > 0 && (
          <View style={styles.maintenanceOverview}>
            <View style={styles.maintenanceOverviewItem}>
              <Text style={[styles.maintenanceOverviewNumber, styles.overdueText]}>
                {maintenanceCounts.overdue}
              </Text>
              <Text style={styles.maintenanceOverviewLabel}>Overdue</Text>
            </View>
            <View style={styles.maintenanceOverviewItem}>
              <Text style={[styles.maintenanceOverviewNumber, styles.dueSoonText]}>
                {maintenanceCounts.dueSoon}
              </Text>
              <Text style={styles.maintenanceOverviewLabel}>Due soon</Text>
            </View>
            <View style={styles.maintenanceOverviewItem}>
              <Text style={[styles.maintenanceOverviewNumber, styles.upcomingText]}>
                {maintenanceCounts.upcoming}
              </Text>
              <Text style={styles.maintenanceOverviewLabel}>Upcoming</Text>
            </View>
          </View>
        )}
      <View style={styles.maintenanceSection}>
        {isLoadingMaintenance ? (
          <View style={styles.infoCard}>
            <Text style={styles.emptyDescription}>
              Loading maintenance schedules...
            </Text>
          </View>
        ) : isMaintenanceError ? (
          <Pressable
            style={styles.infoCard}
            onPress={() =>
              void refetchMaintenance()
            }
          >
            <Text style={styles.errorText}>
              Could not load maintenance schedules.
              Tap to retry.
            </Text>
          </Pressable>
        ) : maintenanceSchedules.length === 0 ? (
          <View style={styles.infoCard}>
            <Text style={styles.emptyDescription}>
              No maintenance schedules configured
              for this car.
            </Text>
          </View>
        ) : (
          maintenanceSchedules.map((schedule) => {
            const maintenanceStatus = calculateMaintenanceStatus(
              schedule,
              car.mileage,
            );

            const statusStyle =
              maintenanceStatus.status === 'OVERDUE'
                ? styles.statusOverdue
                : maintenanceStatus.status === 'DUE_SOON'
                  ? styles.statusDueSoon
                  : maintenanceStatus.status === 'UPCOMING'
                    ? styles.statusUpcoming
                    : styles.statusNeutral;

            return (
            <Pressable
              key={schedule.id}
              style={styles.maintenanceCard}
              onPress={() =>
                openMaintenance(schedule.id)
              }
              accessibilityRole="button"
              accessibilityLabel={`Edit ${maintenanceName(schedule)} maintenance schedule`}
            >
              <View style={styles.maintenanceHeader}>
                <Text style={styles.maintenanceName}>
                  {maintenanceName(schedule)}
                </Text>

                <View style={[styles.statusBadge, statusStyle]}>
                  <Text style={[styles.statusText, statusStyle]}>
                    {maintenanceStatus.label}
                  </Text>
                </View>
              </View>
              <Text style={styles.maintenanceMeta}>
                Interval: {maintenanceInterval(schedule)}
              </Text>
              {schedule.enabled ? (
                <>
                  <Text style={styles.maintenanceMeta}>
                    Next due mileage:{' '}
                    {schedule.nextDueMileage !== null
                      ? `${schedule.nextDueMileage.toLocaleString()} km`
                      : 'Not calculated'}
                  </Text>
                  <Text style={styles.maintenanceMeta}>
                    Next due date:{' '}
                    {schedule.nextDueDate
                      ? formatDate(schedule.nextDueDate)
                      : 'Not calculated'}
                  </Text>
                </>
              ) : (
                <Text style={styles.maintenanceHint}>
                  Enable this schedule after configuring
                  its maintenance interval.
                </Text>
              )}
              <Text style={styles.maintenanceEditHint}>
                Tap to edit ›
              </Text>
            </Pressable>
            );
          })
        )}
      </View>
      <Text style={styles.sectionTitle}>
        SERVICE STATISTICS
      </Text>
      <View style={styles.statsRow}>
        <StatCard
          value={String(sortedServices.length)}
          label="Services"
        />
        {Object.entries(totalsByCurrency).map(
          ([currency, total]) => (
            <StatCard
              key={currency}
              value={`${total.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 2,
                },
              )} ${currency}`}
              label={`Total spent (${currency})`}
            />
          ),
        )}
      </View>
      <Text style={styles.sectionTitle}>
        LATEST SERVICE
      </Text>
      <View style={styles.infoCard}>
        {isLoadingServices ? (
          <Text style={styles.emptyDescription}>
            Loading service history...
          </Text>
        ) : isServicesError ? (
          <Pressable
            onPress={() =>
              void refetchServices()
            }
          >
            <Text style={styles.errorText}>
              Could not load services. Tap to retry.
            </Text>
          </Pressable>
        ) : latestService ? (
          <>
            <Text style={styles.latestServiceName}>
              {latestService.title}
            </Text>
            <InfoRow
              label="Date"
              value={formatDate(
                latestService.date,
              )}
            />
            <InfoRow
              label="Mileage"
              value={`${latestService.mileage.toLocaleString()} km`}
            />
            <InfoRow
              label="Cost"
              value={`${formatCost(
                latestService.cost,
              )} ${latestService.currency ?? ''}`}
            />
            <InfoRow
              label="Workshop"
              value={
                latestService.workshop ||
                'Not specified'
              }
              isLast
            />
            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                openService(latestService.id)
              }
            >
              <Text style={styles.secondaryButtonText}>
                View service details
              </Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.emptyDescription}>
            No service records yet. Add your first
            service to start tracking this car’s
            maintenance history.
          </Text>
        )}
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          SERVICE HISTORY
        </Text>
        <Pressable onPress={openNewService}>
          <Text style={styles.addLink}>
            + Add service
          </Text>
        </Pressable>
      </View>
      {!isLoadingServices &&
        !isServicesError &&
        sortedServices.length === 0 && (
          <View style={styles.infoCard}>
            <Text style={styles.emptyDescription}>
              Your service records will appear here.
            </Text>
          </View>
        )}
      {sortedServices.map((service) => (
        <Pressable
          key={service.id}
          style={styles.serviceCard}
          onPress={() =>
            openService(service.id)
          }
        >
          <View style={styles.serviceCardContent}>
            <Text style={styles.serviceName}>
              {service.title}
            </Text>
            <Text style={styles.serviceMeta}>
              {formatDate(service.date)} ·{' '}
              {service.mileage.toLocaleString()} km
            </Text>
            {service.workshop ? (
              <Text style={styles.serviceWorkshop}>
                {service.workshop}
              </Text>
            ) : null}
          </View>
          <View style={styles.servicePriceContainer}>
            <Text style={styles.servicePrice}>
              {formatCost(service.cost)}
            </Text>
            <Text style={styles.serviceCurrency}>
              {service.currency ?? ''}
            </Text>
          </View>
        </Pressable>
      ))}
      <Pressable
        style={styles.addServiceButton}
        onPress={openNewService}
      >
        <Text style={styles.primaryButtonText}>
          + Add service record
        </Text>
      </Pressable>
      <Pressable
        style={styles.deleteButton}
        onPress={handleDelete}
        disabled={deleteCar.isPending}
      >
        <Text style={styles.deleteButtonText}>
          {deleteCar.isPending
            ? 'Deleting...'
            : 'Delete car'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
function InfoRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        isLast && styles.infoRowLast,
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
function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text
        style={styles.statValue}
        numberOfLines={2}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    color: '#525866',
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  editButtonText: {
    color: '#252A34',
    fontSize: 14,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: '#202938',
    borderRadius: 22,
    padding: 22,
    marginBottom: 28,
  },
  primaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DDECE5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 14,
  },
  primaryBadgeText: {
    color: '#276749',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  carTitle: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
  },
  carSubtitle: {
    color: '#C7CDD7',
    fontSize: 15,
    marginTop: 6,
  },
  mileageContainer: {
    borderTopWidth: 1,
    borderTopColor: '#414B5B',
    marginTop: 22,
    paddingTop: 18,
  },
  mileageLabel: {
    color: '#C7CDD7',
    fontSize: 13,
  },
  mileageValue: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '800',
    marginTop: 5,
  },
  sectionTitle: {
    color: '#737B89',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
    gap: 12,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    color: '#737B89',
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    color: '#252A34',
    fontSize: 14,
    fontWeight: '600',
    flex: 1.4,
    textAlign: 'right',
  },
  maintenanceOverview: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  maintenanceOverviewItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  maintenanceOverviewNumber: {
    fontSize: 23,
    fontWeight: '800',
  },
  maintenanceOverviewLabel: {
    color: '#737B89',
    fontSize: 12,
    marginTop: 4,
  },
  overdueText: { color: '#C53030' },
  dueSoonText: { color: '#9A6700' },
  upcomingText: { color: '#276749' },
  maintenanceSection: {
    marginBottom: 16,
  },
  maintenanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  maintenanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  maintenanceName: {
    color: '#252A34',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  maintenanceEnabled: {
    color: '#276749',
    fontSize: 12,
    fontWeight: '700',
  },
  maintenanceDisabled: {
    color: '#737B89',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusOverdue: {
    color: '#B42318',
    backgroundColor: '#FEF3F2',
    borderColor: '#FECDCA',
  },
  statusDueSoon: {
    color: '#B54708',
    backgroundColor: '#FFFAEB',
    borderColor: '#FEDF89',
  },
  statusUpcoming: {
    color: '#027A48',
    backgroundColor: '#ECFDF3',
    borderColor: '#ABEFC6',
  },
  statusNeutral: {
    color: '#667085',
    backgroundColor: '#F2F4F7',
    borderColor: '#EAECF0',
  },
  maintenanceMeta: {
    color: '#737B89',
    fontSize: 13,
    marginTop: 5,
  },
  maintenanceHint: {
    color: '#737B89',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  maintenanceEditHint: {
    color: '#246BFD',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },
  statValue: {
    color: '#252A34',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#737B89',
    fontSize: 12,
    marginTop: 8,
  },
  latestServiceName: {
    color: '#252A34',
    fontSize: 17,
    fontWeight: '700',
    paddingVertical: 12,
  },
  secondaryButton: {
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#252A34',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addLink: {
    color: '#246BFD',
    fontSize: 14,
    fontWeight: '700',
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  serviceCardContent: {
    flex: 1,
  },
  serviceName: {
    color: '#252A34',
    fontSize: 15,
    fontWeight: '700',
  },
  serviceMeta: {
    color: '#737B89',
    fontSize: 12,
    marginTop: 6,
  },
  serviceWorkshop: {
    color: '#737B89',
    fontSize: 12,
    marginTop: 4,
  },
  servicePriceContainer: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    color: '#252A34',
    fontSize: 16,
    fontWeight: '800',
  },
  serviceCurrency: {
    color: '#737B89',
    fontSize: 11,
    marginTop: 3,
  },
  addServiceButton: {
    backgroundColor: '#246BFD',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: '#246BFD',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#C53030',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#252A34',
    fontSize: 22,
    fontWeight: '800',
  },
  emptyDescription: {
    color: '#737B89',
    fontSize: 14,
    lineHeight: 21,
    marginVertical: 8,
  },
  errorText: {
    color: '#C53030',
    fontSize: 14,
    paddingVertical: 16,
  },
});
