
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    Bell,
    CarFront,
    ChevronRight,
    Gauge,
    Pencil,
    Plus,
    Settings2,
    Trash2,
    Wrench,
} from 'lucide-react-native';
import { useEffect, useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
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

const NAVY = '#092344';

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
    const counts = {
      overdue: 0,
      dueSoon: 0,
      upcoming: 0,
    };

    if (!car) return counts;

    for (const schedule of maintenanceSchedules) {
      const status = calculateMaintenanceStatus(
        schedule,
        car.mileage,
      ).status;

      if (status === 'OVERDUE') {
        counts.overdue += 1;
      } else if (status === 'DUE_SOON') {
        counts.dueSoon += 1;
      } else if (status === 'UPCOMING') {
        counts.upcoming += 1;
      }
    }

    return counts;
  }, [maintenanceSchedules, car?.mileage]);

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
    if (!car) return;

    router.push({
      pathname: '/service/[id]',
      params: {
        id: serviceId,
        vehicleId: car.id,
      },
    });
  };

  const openNewService = () => {
    if (!car) return;

    router.push({
      pathname: '/service/new',
      params: {
        vehicleId: car.id,
      },
    });
  };

  const openMaintenance = (scheduleId: string) => {
    if (!car) return;

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
    <View style={styles.screen}>
      <ImageBackground
        source={require('../../../assets/images/lovablecar-main-background.png')}
        resizeMode="cover"
        style={styles.background}
        blurRadius={10}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <View style={styles.topbar}>
            <Pressable
              style={styles.roundButton}
              onPress={() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/cars');
    }
  }}
            >
              <ArrowLeft size={22} color={NAVY} />
            </Pressable>

            <Text style={styles.topTitle}>
              Car Details
            </Text>

            <Pressable
              style={styles.editPill}
              onPress={() =>
                router.push({
                  pathname: '/car/edit',
                  params: { id: car.id },
                })
              }
            >
              <Pencil size={15} color={NAVY} />
              <Text style={styles.editText}>
                Edit
              </Text>
            </Pressable>
          </View>

          {/* VEHICLE HERO */}
          <View style={styles.hero}>
            {car.isPrimary && (
              <Text style={styles.primaryLabel}>
                ★ PRIMARY CAR
              </Text>
            )}

            <Text style={styles.vehicleTitle}>
              {car.make} {car.model}
            </Text>

            <Text style={styles.vehicleSubtitle}>
              {car.year}
              {car.engine ? ` · ${car.engine}` : ''}
            </Text>

            <View style={styles.carIllustration}>
              <CarFront
                size={112}
                strokeWidth={1.3}
                color="#FFC928"
              />

              <View style={styles.yellowAccent} />
            </View>

            {!!car.licensePlate && (
              <Text style={styles.plate}>
                {car.licensePlate}
              </Text>
            )}
          </View>

          {/* STATISTICS */}
          <View style={styles.statRow}>
            <View style={styles.statCard}>
              <Gauge size={23} color={NAVY} />

              <Text style={styles.statNumber}>
                {car.mileage.toLocaleString()}
              </Text>

              <Text style={styles.statLabel}>
                Mileage, km
              </Text>
            </View>

            <View style={styles.statCard}>
              <Wrench size={23} color={NAVY} />

              <Text style={styles.statNumber}>
                {sortedServices.length}
              </Text>

              <Text style={styles.statLabel}>
                Services
              </Text>
            </View>

            <View style={styles.statCard}>
              <Bell size={23} color="#E6AC00" />

              <Text style={styles.statNumber}>
                {maintenanceCounts.overdue +
                  maintenanceCounts.dueSoon +
                  maintenanceCounts.upcoming}
              </Text>

              <Text style={styles.statLabel}>
                Maintenance
              </Text>
            </View>
          </View>

          {/* UPCOMING SERVICE */}
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Upcoming Service
            </Text>

            <Text style={styles.sectionHint}>
              {maintenanceSchedules.length} schedules
            </Text>
          </View>

          {isLoadingMaintenance ? (
            <View style={styles.whiteCard}>
              <ActivityIndicator color={NAVY} />
            </View>
          ) : isMaintenanceError ? (
            <Pressable
              style={styles.whiteCard}
              onPress={() =>
                void refetchMaintenance()
              }
            >
              <Text style={styles.muted}>
                Unable to load maintenance. Tap to retry.
              </Text>
            </Pressable>
          ) : maintenanceSchedules.length === 0 ? (
            <View style={styles.whiteCard}>
              <Text style={styles.muted}>
                No maintenance schedules configured yet.
              </Text>
            </View>
          ) : (
            maintenanceSchedules.map((schedule, index) => {
              const status =
                calculateMaintenanceStatus(
                  schedule,
                  car.mileage,
                );

              const remaining =
                schedule.nextDueMileage == null
                  ? null
                  : schedule.nextDueMileage -
                    car.mileage;

              const ratio =
                schedule.intervalKm && remaining != null
                  ? Math.max(
                      0,
                      Math.min(
                        1,
                        1 - remaining / schedule.intervalKm,
                      ),
                    )
                  : null;

              return (
                <Pressable
                  key={schedule.id}
                  onPress={() =>
                    openMaintenance(schedule.id)
                  }
                  style={[
                    styles.maintenanceCard,
                    index === 0 && styles.highlightCard,
                  ]}
                >
                  <View style={styles.maintenanceIcon}>
                    <Wrench size={23} color={NAVY} />
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>
                      {maintenanceName(schedule)}
                    </Text>

                    <Text style={styles.cardSub}>
                      {!schedule.enabled
                        ? 'Schedule disabled'
                        : remaining != null
                          ? remaining < 0
                            ? `${Math.abs(remaining).toLocaleString()} km overdue`
                            : `in ${remaining.toLocaleString()} km`
                          : schedule.nextDueDate
                            ? `Due ${formatDate(schedule.nextDueDate)}`
                            : maintenanceInterval(schedule)}
                    </Text>

                    {ratio !== null && (
                      <View style={styles.track}>
                        <View
                          style={[
                            styles.trackFill,
                            {
                              width: `${Math.round(ratio * 100)}%`,
                              backgroundColor:
                                status.status === 'OVERDUE'
                                  ? '#E35B51'
                                  : '#FFC629',
                            },
                          ]}
                        />
                      </View>
                    )}

                    <Text style={styles.tinyText}>
                      {status.label}
                      {schedule.nextDueMileage != null
                        ? ` · ${schedule.nextDueMileage.toLocaleString()} km`
                        : ''}
                    </Text>
                  </View>

                  <ChevronRight
                    size={20}
                    color="#7893B1"
                  />
                </Pressable>
              );
            })
          )}

          {/* RECENT SERVICES */}
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Recent Services
            </Text>

            <Pressable onPress={openNewService}>
              <Text style={styles.link}>
                + Add new
              </Text>
            </Pressable>
          </View>

          {isLoadingServices ? (
            <View style={styles.whiteCard}>
              <ActivityIndicator color={NAVY} />
            </View>
          ) : isServicesError ? (
            <Pressable
              style={styles.whiteCard}
              onPress={() => void refetchServices()}
            >
              <Text style={styles.muted}>
                Unable to load services. Tap to retry.
              </Text>
            </Pressable>
          ) : sortedServices.length === 0 ? (
            <View style={styles.whiteCard}>
              <Text style={styles.muted}>
                No services yet. Add your first service record.
              </Text>
            </View>
          ) : (
            sortedServices.slice(0, 4).map((service) => (
              <Pressable
                key={service.id}
                style={styles.serviceCard}
                onPress={() =>
                  openService(service.id)
                }
              >
                <View style={styles.serviceIcon}>
                  <Wrench
                    size={20}
                    color="#2478C5"
                  />
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>
                    {service.title}
                  </Text>

                  <Text style={styles.cardSub}>
                    {formatDate(service.date)}
                    {' · '}
                    {service.mileage.toLocaleString()} km
                  </Text>
                </View>

                <View style={styles.priceBox}>
                  <Text style={styles.price}>
                    {formatCost(service.cost)}
                  </Text>

                  <Text style={styles.currency}>
                    {service.currency || ''}
                  </Text>
                </View>

                <ChevronRight
                  size={18}
                  color="#7893B1"
                />
              </Pressable>
            ))
          )}

          {/* VEHICLE INFORMATION */}
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>
              Vehicle Information
            </Text>

            <Settings2 size={20} color={NAVY} />
          </View>

          <View style={styles.detailsCard}>
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
              value={car.licensePlate || 'Not specified'}
              isLast
            />
          </View>

          {/* SERVICE COSTS */}
          {Object.keys(totalsByCurrency).length > 0 && (
            <View style={styles.spending}>
              <Text style={styles.sectionTitle}>
                Total Service Costs
              </Text>

              {Object.entries(totalsByCurrency).map(
                ([currency, total]) => (
                  <Text
                    key={currency}
                    style={styles.spendingText}
                  >
                    {total.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{' '}
                    {currency}
                  </Text>
                ),
              )}
            </View>
          )}

          {/* ACTIONS */}
          <Pressable
            style={styles.addButton}
            onPress={openNewService}
          >
            <Plus size={21} color={NAVY} />
            <Text style={styles.addButtonText}>
              Add Service
            </Text>
          </Pressable>

          <Pressable
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleteCar.isPending}
          >
            <Trash2 size={16} color="#C65050" />

            <Text style={styles.deleteText}>
              {deleteCar.isPending
                ? 'Deleting...'
                : 'Delete car'}
            </Text>
          </Pressable>
        </ScrollView>
      </ImageBackground>
    </View>
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
        !isLast && styles.infoBorder,
      ]}
    >
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={styles.infoValue}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#BFE6FF',
  },
  background: {
    flex: 1,
    width: '100%',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 55,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
  },
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D6EFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
  },
  editText: {
    color: NAVY,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 215,
  },
  primaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1768A9',
    letterSpacing: 1,
    marginBottom: 8,
  },
  vehicleTitle: {
    fontSize: 29,
    fontWeight: '900',
    color: NAVY,
    textAlign: 'center',
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 5,
  },
  carIllustration: {
    height: 120,
    width: '100%',
    color: '#FFC928',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yellowAccent: {
    width: 100,
    height: 5,
    borderRadius: 5,
    backgroundColor: '#FFC928',
    marginTop: -8,
  },
  plate: {
    fontSize: 12,
    color: '#3B6287',
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFFED',
    borderRadius: 16,
    minHeight: 105,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  statNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: NAVY,
  },
  statLabel: {
    fontSize: 11,
    color: '#557599',
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 11,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: NAVY,
  },
  sectionHint: {
    fontSize: 12,
    color: '#53789D',
  },
  link: {
    color: '#0872D5',
    fontSize: 13,
    fontWeight: '700',
  },
  maintenanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFFF2',
    borderRadius: 17,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  highlightCard: {
    backgroundColor: '#FFF7DC',
    borderWidth: 1,
    borderColor: '#FFDA68',
  },
  maintenanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFD43B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 5,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
  },
  cardSub: {
    fontSize: 12,
    color: '#41658E',
  },
  tinyText: {
    fontSize: 10,
    color: '#6382A4',
  },
  track: {
    height: 6,
    backgroundColor: '#E6EDF3',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 4,
  },
  trackFill: {
    height: '100%',
    borderRadius: 5,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFFF2',
    padding: 13,
    borderRadius: 16,
    marginBottom: 9,
    gap: 10,
  },
  serviceIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#E4F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
  },
  currency: {
    fontSize: 10,
    color: '#58799D',
  },
  detailsCard: {
    backgroundColor: '#FFFFFFF2',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  infoBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E6EFF6',
  },
  infoLabel: {
    color: '#5B7695',
    fontSize: 13,
  },
  infoValue: {
    color: NAVY,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  whiteCard: {
    backgroundColor: '#FFFFFFE8',
    borderRadius: 16,
    padding: 18,
  },
  muted: {
    color: '#58799D',
    fontSize: 13,
  },
  spending: {
    backgroundColor: '#FFFFFFE8',
    borderRadius: 16,
    marginTop: 18,
    padding: 18,
    gap: 10,
  },
  spendingText: {
    fontSize: 22,
    fontWeight: '900',
    color: NAVY,
  },
  addButton: {
    backgroundColor: '#FFD43B',
    height: 54,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 22,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: NAVY,
  },
  deleteButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    padding: 15,
    marginTop: 8,
  },
  deleteText: {
    color: '#C65050',
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    backgroundColor: '#DDF1FF',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: NAVY,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#53789D',
    textAlign: 'center',
    marginVertical: 12,
  },
  primaryButton: {
    backgroundColor: '#FFD43B',
    borderRadius: 14,
    padding: 16,
    marginTop: 15,
  },
  primaryButtonText: {
    color: NAVY,
    fontWeight: '800',
  },
});
