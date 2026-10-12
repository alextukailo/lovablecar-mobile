
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { api } from '../../../lib/api';
import {
    useCarMaintenanceSchedules,
} from '../../../lib/maintenance.queries';
import { useCars } from '../../features/cars/hooks/useCars';
import {
    formatMaintenanceDeadline,
    getMaintenanceName,
} from '../../features/maintenance/utils/maintenance-display';
import {
    calculateMaintenanceOverview,
} from '../../features/maintenance/utils/maintenance-overview';
import {
    findNextMaintenance,
} from '../../features/maintenance/utils/next-maintenance';
import { useCarStore } from '../../store/car.store';

interface ApiService {
  id: string;
  carId?: string;
  vehicleId?: string;
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

export default function HomeScreen() {
  const {
    data: cars = [],
    isLoading: isLoadingCars,
    isError: isCarsError,
    refetch: refetchCars,
  } = useCars();

  const storedSelectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectedCar =
    cars.find(
      (car) => car.id === storedSelectedCarId,
    ) ??
    cars.find((car) => car.isPrimary) ??
    cars[0] ??
    null;

  const selectedCarId = selectedCar?.id;

  const {
    data: services = [],
    isLoading: isLoadingServices,
    isError: isServicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['cars', selectedCarId, 'services'],
    queryFn: () => fetchCarServices(selectedCarId!),
    enabled: Boolean(selectedCarId),
  });

  const {
    data: maintenanceSchedules = [],
    isLoading: isLoadingMaintenance,
    isError: isMaintenanceError,
    refetch: refetchMaintenance,
  } = useCarMaintenanceSchedules(selectedCarId ?? '');

  // Shared maintenance calculations.
  // No database writes or modifications to schedules.
  const maintenanceOverview = calculateMaintenanceOverview(
    maintenanceSchedules,
    selectedCar?.mileage ?? 0,
  );

  const maintenanceCounts = maintenanceOverview.counts;

  const nextMaintenance = selectedCar
    ? findNextMaintenance(
        maintenanceSchedules,
        selectedCar.mileage,
      )
    : null;

  const recentServices = [...services]
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime(),
    )
    .slice(0, 3);

  const openSelectedCar = () => {
    if (selectedCarId) {
      router.push({
        pathname: '/car/[id]',
        params: { id: selectedCarId },
      });
    } else {
      router.push('/(tabs)/cars');
    }
  };

  const openNextMaintenance = () => {
    if (selectedCarId && nextMaintenance) {
      router.push({
        pathname: '/maintenance/[id]',
        params: {
          id: nextMaintenance.schedule.id,
          carId: selectedCarId,
        },
      });
      return;
    }

    openSelectedCar();
  };

  const handleAddService = () => {
    if (!selectedCarId) {
      router.push('/(tabs)/cars');
      return;
    }

    router.push({
      pathname: '/service/new',
      params: { vehicleId: selectedCarId },
    });
  };

  const nextServiceTitle = !selectedCar
    ? 'No car selected'
    : isLoadingMaintenance
      ? 'Loading maintenance...'
      : isMaintenanceError
        ? 'Maintenance unavailable'
        : nextMaintenance
          ? getMaintenanceName(nextMaintenance.schedule)
          : 'Not configured yet';

  const nextServiceDescription = !selectedCar
    ? 'Select a car to get started'
    : isLoadingMaintenance
      ? 'Checking your schedules'
      : isMaintenanceError
        ? 'Could not check maintenance'
        : nextMaintenance
          ? formatMaintenanceDeadline(nextMaintenance.result)
          : 'Set up a maintenance schedule';

  const nextServiceStatus =
    nextMaintenance?.result.label ?? null;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.logo}>LovableCar</Text>

        <Text style={styles.greeting}>
          Good morning 👋
        </Text>

        {/* Current car */}
        <Pressable
          style={styles.carCard}
          onPress={openSelectedCar}
        >
          <View style={styles.carInfo}>
            <Text style={styles.carTitle}>
              🚗{' '}
              {isLoadingCars
                ? 'Loading car...'
                : selectedCar
                  ? `${selectedCar.make} ${selectedCar.model}`
                  : 'No car selected'}
            </Text>

            {selectedCar && (
              <Text style={styles.carSubtitle}>
                {selectedCar.year}
                {selectedCar.engine
                  ? ` · ${selectedCar.engine}`
                  : ''}
              </Text>
            )}

            {isCarsError && (
              <Text style={styles.errorText}>
                Could not load cars.
              </Text>
            )}
          </View>

          {selectedCar && (
            <Text style={styles.mileage}>
              {selectedCar.mileage.toLocaleString()} km
            </Text>
          )}
        </Pressable>

        {isCarsError && (
          <Pressable onPress={() => void refetchCars()}>
            <Text style={styles.retryText}>
              Tap to retry loading cars
            </Text>
          </Pressable>
        )}

        {/* Maintenance overview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            MAINTENANCE OVERVIEW
          </Text>
        </View>

        {!selectedCar ? (
          <View style={styles.maintenanceEmptyCard}>
            <Text style={styles.maintenanceEmptyTitle}>
              No car selected
            </Text>

            <Text style={styles.maintenanceEmptyText}>
              Add or select a car to see maintenance reminders.
            </Text>
          </View>
        ) : isLoadingMaintenance ? (
          <View style={styles.maintenanceEmptyCard}>
            <Text style={styles.statusText}>
              Loading maintenance schedules...
            </Text>
          </View>
        ) : isMaintenanceError ? (
          <Pressable
            style={styles.maintenanceEmptyCard}
            onPress={() => void refetchMaintenance()}
          >
            <Text style={styles.errorText}>
              Could not load maintenance schedules.
              Tap to retry.
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.maintenanceOverviewCard}
            onPress={openSelectedCar}
          >
            <View style={styles.maintenanceCountRow}>
              <View style={styles.maintenanceCountItem}>
                <Text
                  style={[
                    styles.maintenanceCount,
                    styles.overdueCount,
                  ]}
                >
                  {maintenanceCounts.overdue}
                </Text>

                <Text style={styles.maintenanceCountLabel}>
                  Overdue
                </Text>
              </View>

              <View style={styles.maintenanceCountDivider} />

              <View style={styles.maintenanceCountItem}>
                <Text
                  style={[
                    styles.maintenanceCount,
                    styles.dueSoonCount,
                  ]}
                >
                  {maintenanceCounts.dueSoon}
                </Text>

                <Text style={styles.maintenanceCountLabel}>
                  Due soon
                </Text>
              </View>

              <View style={styles.maintenanceCountDivider} />

              <View style={styles.maintenanceCountItem}>
                <Text
                  style={[
                    styles.maintenanceCount,
                    styles.upcomingCount,
                  ]}
                >
                  {maintenanceCounts.upcoming}
                </Text>

                <Text style={styles.maintenanceCountLabel}>
                  Upcoming
                </Text>
              </View>
            </View>

            <Text style={styles.maintenanceOverviewFooter}>
              {maintenanceCounts.configured === 0
                ? 'No maintenance due dates configured yet'
                : 'View maintenance schedules ›'}
            </Text>

            {maintenanceCounts.unconfigured > 0 && (
              <Text style={styles.maintenanceUnconfigured}>
                {maintenanceCounts.unconfigured}{' '}
                {maintenanceCounts.unconfigured === 1
                  ? 'enabled schedule needs configuration'
                  : 'enabled schedules need configuration'}
              </Text>
            )}
          </Pressable>
        )}

        {/* Next service */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            NEXT SERVICE
          </Text>
        </View>

        <Pressable
          style={styles.nextServiceCard}
          onPress={openNextMaintenance}
        >
          <View style={styles.serviceIcon}>
            <View style={styles.serviceDot} />
          </View>

          <View style={styles.nextServiceContent}>
            <Text style={styles.nextServiceTitle}>
              {nextServiceTitle}
            </Text>

            <Text style={styles.nextServiceDistance}>
              {nextServiceDescription}
            </Text>

            {nextServiceStatus && (
              <Text
                style={[
                  styles.nextServiceStatus,
                  nextMaintenance?.result.status === 'OVERDUE'
                    ? styles.nextServiceOverdue
                    : nextMaintenance?.result.status === 'DUE_SOON'
                      ? styles.nextServiceDueSoon
                      : styles.nextServiceUpcoming,
                ]}
              >
                {nextServiceStatus}
              </Text>
            )}

            <Text style={styles.nextServiceTime}>
              {nextMaintenance
                ? 'Tap to edit maintenance schedule'
                : selectedCar
                  ? 'Tap to view maintenance details'
                  : 'No reminder configured'}
            </Text>
          </View>
        </Pressable>

        {/* Add service */}
        <Pressable
          style={styles.addButton}
          onPress={handleAddService}
        >
          <Text style={styles.addButtonText}>
            + Add service
          </Text>
        </Pressable>

        {/* Recent services */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>RECENT</Text>

          {services.length > 0 && (
            <Pressable
              onPress={() => router.push('/(tabs)/services')}
            >
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          )}
        </View>

        {isLoadingServices ? (
          <Text style={styles.statusText}>
            Loading recent services...
          </Text>
        ) : isServicesError ? (
          <Pressable
            onPress={() => void refetchServices()}
          >
            <Text style={styles.errorText}>
              Could not load services. Tap to retry.
            </Text>
          </Pressable>
        ) : recentServices.length === 0 ? (
          <EmptyRecent />
        ) : (
          <View>
            {recentServices.map((service) => (
              <RecentService
                key={service.id}
                date={service.date}
                name={service.title}
                cost={
                  service.cost != null
                    ? `${service.cost} ${
                        service.currency ?? ''
                      }`.trim()
                    : '—'
                }
                onPress={() => {
                  if (!selectedCarId) return;

                  router.push({
                    pathname: '/service/[id]',
                    params: {
                      id: service.id,
                      vehicleId: selectedCarId,
                    },
                  });
                }}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

function RecentService({
  date,
  name,
  cost,
  onPress,
}: {
  date: string;
  name: string;
  cost: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.recentItem}
      onPress={onPress}
    >
      <View style={styles.recentDate}>
        <Text style={styles.dateText}>
          {formatShortDate(date)}
        </Text>
      </View>

      <View style={styles.recentInfo}>
        <Text style={styles.recentName}>
          {name}
        </Text>
      </View>

      <Text style={styles.recentCost}>{cost}</Text>
    </Pressable>
  );
}

function EmptyRecent() {
  return (
    <View style={styles.emptyRecent}>
      <Text style={styles.emptyRecentIcon}>🔧</Text>

      <View style={styles.emptyRecentContent}>
        <Text style={styles.emptyRecentTitle}>
          No service records yet
        </Text>

        <Text style={styles.emptyRecentText}>
          Add your first service to start tracking your car.
        </Text>
      </View>
    </View>
  );
}

function formatShortDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#171717',
  },
  greeting: {
    fontSize: 15,
    color: '#737373',
    marginTop: 4,
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  carInfo: {
    flex: 1,
    paddingRight: 12,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
  },
  carSubtitle: {
    fontSize: 14,
    color: '#737373',
    marginTop: 5,
  },
  mileage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#737373',
  },
  maintenanceOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  maintenanceCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maintenanceCountItem: {
    flex: 1,
    alignItems: 'center',
  },
  maintenanceCount: {
    fontSize: 28,
    fontWeight: '800',
  },
  overdueCount: {
    color: '#C53030',
  },
  dueSoonCount: {
    color: '#9A6700',
  },
  upcomingCount: {
    color: '#276749',
  },
  maintenanceCountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#737373',
    marginTop: 4,
  },
  maintenanceCountDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
  },
  maintenanceOverviewFooter: {
    fontSize: 13,
    fontWeight: '600',
    color: '#737373',
    marginTop: 18,
    textAlign: 'center',
  },
  maintenanceUnconfigured: {
    fontSize: 12,
    color: '#9A6700',
    marginTop: 8,
    textAlign: 'center',
  },
  maintenanceEmptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  maintenanceEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },
  maintenanceEmptyText: {
    fontSize: 13,
    color: '#737373',
    marginTop: 5,
  },
  nextServiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F5C400',
  },
  nextServiceContent: {
    marginLeft: 14,
    flex: 1,
  },
  nextServiceTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171717',
  },
  nextServiceDistance: {
    fontSize: 14,
    color: '#737373',
    marginTop: 4,
  },
  nextServiceStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 7,
  },
  nextServiceOverdue: {
    color: '#C53030',
  },
  nextServiceDueSoon: {
    color: '#9A6700',
  },
  nextServiceUpcoming: {
    color: '#276749',
  },
  nextServiceTime: {
    fontSize: 13,
    color: '#A3A3A3',
    marginTop: 5,
  },
  addButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F5C400',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
  },
  recentHeader: {
    marginTop: 32,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
  },
  recentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minHeight: 64,
    paddingHorizontal: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentDate: {
    width: 65,
  },
  dateText: {
    fontSize: 13,
    color: '#737373',
  },
  recentInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },
  recentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
  },
  recentCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
  },
  emptyRecent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyRecentIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  emptyRecentContent: {
    flex: 1,
  },
  emptyRecentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
  },
  emptyRecentText: {
    fontSize: 13,
    color: '#737373',
    marginTop: 3,
  },
  bottomSpace: {
    height: 30,
  },
  statusText: {
    fontSize: 14,
    color: '#737373',
    marginTop: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#B91C1C',
    marginTop: 6,
  },
  retryText: {
    fontSize: 13,
    color: '#B91C1C',
    marginTop: 10,
  },
});
