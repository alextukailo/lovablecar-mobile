
import { useQuery } from '@tanstack/react-query';
import {
    router,
    Stack,
    useLocalSearchParams,
} from 'expo-router';
import {
    ArrowLeft,
    Bell,
    CalendarClock,
    CalendarDays,
    CarFront,
    ChevronRight,
    FileText,
    Gauge,
    Hash,
    Pencil,
    Plus,
    Settings2,
    ShieldCheck,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '../../../lib/api';
import type { ApiMaintenanceSchedule } from '../../../lib/maintenance.api';
import { useCarMaintenanceSchedules } from '../../../lib/maintenance.queries';
import {
    useCar,
    useDeleteCar,
} from '../../features/cars/hooks/useCars';
import { calculateMaintenanceStatus } from '../../features/maintenance/utils/maintenance-status';
import { useCarStore } from '../../store/car.store';

const COLORS = {
  navy: '#092747',
  blue: '#1476C8',
  muted: '#6C879F',
  sky: '#DDF2FF',
  white: '#FFFFFF',
  yellow: '#FFCC32',
  border: '#E0EDF6',
  background: '#F6FAFD',
  green: '#218C83',
  red: '#D75A4C',
  amber: '#C58B16',
};

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
  ENGINE_OIL: 'Engine oil & filter',
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

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString();
}

function formatMileage(value: number): string {
  return `${value.toLocaleString('en-US')} km`;
}

function maintenanceInterval(
  schedule: ApiMaintenanceSchedule,
): string {
  const parts: string[] = [];

  if (schedule.intervalKm != null) {
    parts.push(
      `${schedule.intervalKm.toLocaleString()} km`,
    );
  }

  if (schedule.intervalMonths != null) {
    parts.push(
      `${schedule.intervalMonths} months`,
    );
  }

  return parts.length
    ? parts.join(' / ')
    : 'Interval not configured';
}

function InfoRow({
  icon: Icon,
  label,
  value,
  last = false,
}: {
  icon: typeof CarFront;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && styles.rowDivider,
      ]}
    >
      <Icon
        size={21}
        color={COLORS.navy}
        strokeWidth={1.9}
      />

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={styles.infoValue}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

export default function CarDetailsScreen() {
  const insets = useSafeAreaInsets();

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
    enabled: Boolean(carId && car),
  });

  const {
    data: maintenanceSchedules = [],
    isLoading: isLoadingMaintenance,
    isError: isMaintenanceError,
    refetch: refetchMaintenance,
  } = useCarMaintenanceSchedules(car?.id);

  const deleteCar = useDeleteCar();

  useEffect(() => {
    if (!car) return;

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

  const maintenanceCounts = useMemo(() => {
    const result = {
      overdue: 0,
      dueSoon: 0,
      upcoming: 0,
    };

    if (!car) return result;

    for (const schedule of maintenanceSchedules) {
      if (!schedule.enabled) continue;

      const status = calculateMaintenanceStatus(
        schedule,
        car.mileage,
      ).status;

      if (status === 'OVERDUE') {
        result.overdue++;
      } else if (status === 'DUE_SOON') {
        result.dueSoon++;
      } else if (status === 'UPCOMING') {
        result.upcoming++;
      }
    }

    return result;
  }, [maintenanceSchedules, car?.mileage]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/cars');
    }
  };

  const handleEdit = () => {
    if (!car) return;

    router.push({
      pathname: '/car/edit',
      params: { id: car.id },
    });
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

  const openMaintenanceSetup = () => {
    if (!car) return;

    router.push({
      pathname: '/maintenance/new',
      params: {
        carId: car.id,
      },
    });
  };

  const handleDelete = () => {
    if (!car || deleteCar.isPending) return;

    Alert.alert(
      'Delete car?',
      `Delete ${car.make} ${car.model} and its service records? This cannot be undone.`,
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
              Alert.alert(
                'Unable to delete car',
                error instanceof Error
                  ? error.message
                  : 'Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  if (isLoadingCar) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator
          size="large"
          color={COLORS.blue}
        />
      </View>
    );
  }

  if (!car || isCarError) {
    return (
      <View style={styles.centerScreen}>
        <CarFront
          size={44}
          color={COLORS.muted}
        />

        <Text style={styles.errorTitle}>
          Car not found
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => void refetchCar()}
        >
          <Text style={styles.primaryButtonText}>
            Try Again
          </Text>
        </Pressable>

        <Pressable onPress={handleBack}>
          <Text style={styles.backLink}>
            Back to Cars
          </Text>
        </Pressable>
      </View>
    );
  }

  const attentionCount =
    maintenanceCounts.overdue +
    maintenanceCounts.dueSoon;

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{ headerShown: false }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 36,
        }}
      >
        {/* HERO */}

        <ImageBackground
          source={require(
            '../../../assets/images/cars-hero.png'
          )}
          resizeMode="cover"
          style={[
            styles.hero,
            {
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={handleBack}
              style={styles.topButton}
            >
              <ArrowLeft
                size={23}
                color={COLORS.navy}
              />
            </Pressable>

            <Text style={styles.topTitle}>
              Car Details
            </Text>

            <Pressable
              onPress={handleEdit}
              style={styles.topButton}
            >
              <Pencil
                size={20}
                color={COLORS.navy}
              />
            </Pressable>
          </View>

          <View style={styles.heroTextCard}>
            <Text style={styles.heroEyebrow}>
              YOUR VEHICLE
            </Text>

            <Text style={styles.carName}>
              {car.make} {car.model}
            </Text>

            <Text style={styles.carYear}>
              {car.year}
              {car.engine
                ? ` · ${car.engine}`
                : ''}
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          {/* MILEAGE */}

          <View style={styles.mileageCard}>
            <View style={styles.mileageIcon}>
              <Gauge
                size={27}
                color={COLORS.navy}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.mileageLabel}>
                Current mileage
              </Text>

              <Text style={styles.mileageValue}>
                {formatMileage(car.mileage)}
              </Text>
            </View>

            <Pressable
              style={styles.smallEditButton}
              onPress={handleEdit}
            >
              <Pencil
                size={18}
                color={COLORS.navy}
              />
            </Pressable>
          </View>

          {/* QUICK STATS */}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Wrench
                  size={22}
                  color={COLORS.blue}
                />
              </View>

              <Text style={styles.statNumber}>
                {services.length}
              </Text>

              <Text style={styles.statLabel}>
                Services
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Bell
                  size={22}
                  color={COLORS.amber}
                />
              </View>

              <Text style={styles.statNumber}>
                {maintenanceSchedules.length}
              </Text>

              <Text style={styles.statLabel}>
                Schedules
              </Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <CalendarClock
                  size={22}
                  color={
                    attentionCount
                      ? COLORS.red
                      : COLORS.green
                  }
                />
              </View>

              <Text style={styles.statNumber}>
                {attentionCount}
              </Text>

              <Text style={styles.statLabel}>
                Attention
              </Text>
            </View>
          </View>

          {/* VEHICLE INFORMATION */}

          <Text style={styles.sectionTitle}>
            Vehicle Information
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon={CalendarDays}
              label="Year"
              value={String(car.year)}
            />

            <InfoRow
              icon={Settings2}
              label="Engine"
              value={
                car.engine || 'Not specified'
              }
            />

            <InfoRow
              icon={CarFront}
              label="License plate"
              value={
                car.licensePlate ||
                'Not specified'
              }
            />

            <InfoRow
              icon={Hash}
              label="VIN"
              value={car.vin || 'Not specified'}
              last
            />
          </View>

          {/* MAINTENANCE */}

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>
                Maintenance
              </Text>

              <Text style={styles.sectionSubtitle}>
                Your service intervals and reminders
              </Text>
            </View>
          </View>

          {isLoadingMaintenance ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator
                color={COLORS.blue}
              />
            </View>
          ) : isMaintenanceError ? (
            <Pressable
              style={styles.loadingCard}
              onPress={() =>
                void refetchMaintenance()
              }
            >
              <Text style={styles.mutedText}>
                Unable to load schedules.
                Tap to retry.
              </Text>
            </Pressable>
          ) : maintenanceSchedules.length === 0 ? (
            <Pressable
              style={styles.emptyCard}
              onPress={openMaintenanceSetup}
            >
              <View style={styles.emptyIcon}>
                <ShieldCheck
                  size={29}
                  color={COLORS.green}
                />
              </View>

              <Text style={styles.emptyTitle}>
                No maintenance schedules
              </Text>

              <Text style={styles.emptyDescription}>
                Set up oil changes, transmission
                maintenance, brake fluid and more.
              </Text>

              <View style={styles.emptyAction}>
                <Plus
                  size={19}
                  color={COLORS.navy}
                />

                <Text style={styles.emptyActionText}>
                  Set up maintenance
                </Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.maintenanceList}>
              {maintenanceSchedules.map(
                (schedule) => {
                  const result =
                    calculateMaintenanceStatus(
                      schedule,
                      car.mileage,
                    );

                  const remaining =
                    schedule.nextDueMileage != null
                      ? schedule.nextDueMileage -
                        car.mileage
                      : null;

                  const statusColor =
                    !schedule.enabled
                      ? COLORS.muted
                      : result.status === 'OVERDUE'
                        ? COLORS.red
                        : result.status === 'DUE_SOON'
                          ? COLORS.amber
                          : COLORS.green;

                  return (
                    <Pressable
                      key={schedule.id}
                      style={styles.maintenanceItem}
                      onPress={() =>
                        openMaintenance(schedule.id)
                      }
                    >
                      <View
                        style={styles.maintenanceIcon}
                      >
                        <Wrench
                          size={21}
                          color={COLORS.blue}
                        />
                      </View>

                      <View
                        style={styles.maintenanceBody}
                      >
                        <Text
                          style={styles.maintenanceName}
                        >
                          {maintenanceName(schedule)}
                        </Text>

                        <Text
                          style={styles.maintenanceInterval}
                        >
                          Every{' '}
                          {maintenanceInterval(
                            schedule,
                          )}
                        </Text>

                        <Text
                          style={[
                            styles.maintenanceStatus,
                            { color: statusColor },
                          ]}
                        >
                          {!schedule.enabled
                            ? 'Reminders disabled'
                            : remaining != null
                              ? remaining < 0
                                ? `${Math.abs(
                                    remaining,
                                  ).toLocaleString()} km overdue`
                                : `${remaining.toLocaleString()} km remaining`
                              : schedule.nextDueDate
                                ? `Due ${formatDate(
                                    schedule.nextDueDate,
                                  )}`
                                : result.label}
                        </Text>

                        {schedule.nextDueMileage !=
                          null && (
                          <Text
                            style={styles.nextDueText}
                          >
                            Next:{' '}
                            {formatMileage(
                              schedule.nextDueMileage,
                            )}
                          </Text>
                        )}
                      </View>

                      <ChevronRight
                        size={20}
                        color="#9EB5C9"
                      />
                    </Pressable>
                  );
                },
              )}
            </View>
          )}

          {/* ALWAYS VISIBLE SETUP BUTTON */}

          <Pressable
            onPress={openMaintenanceSetup}
            style={styles.manageButton}
          >
            <Plus
              size={21}
              color={COLORS.navy}
            />

            <Text style={styles.manageButtonText}>
              {maintenanceSchedules.length > 0
                ? 'Manage Maintenance'
                : 'Create Maintenance Schedule'}
            </Text>

            <ChevronRight
              size={19}
              color={COLORS.navy}
            />
          </Pressable>

          {/* SERVICE HISTORY */}

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>
                Service History
              </Text>

              <Text style={styles.sectionSubtitle}>
                Your vehicle's maintenance history
              </Text>
            </View>
          </View>

          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceHeaderIcon}>
                <Wrench
                  size={23}
                  color={COLORS.blue}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.serviceCount}>
                  {services.length} service{' '}
                  {services.length === 1
                    ? 'record'
                    : 'records'}
                </Text>

                <Text style={styles.mutedText}>
                  Completed services and repairs
                </Text>
              </View>
            </View>

            {isLoadingServices ? (
              <ActivityIndicator
                style={{ marginVertical: 22 }}
                color={COLORS.blue}
              />
            ) : isServicesError ? (
              <Pressable
                onPress={() =>
                  void refetchServices()
                }
                style={styles.serviceEmpty}
              >
                <Text style={styles.mutedText}>
                  Unable to load services.
                  Tap to retry.
                </Text>
              </Pressable>
            ) : sortedServices.length === 0 ? (
              <View style={styles.serviceEmpty}>
                <FileText
                  size={32}
                  color="#A5C1D8"
                />

                <Text style={styles.mutedText}>
                  No service records yet.
                </Text>
              </View>
            ) : (
              sortedServices.map((service) => (
                <Pressable
                  key={service.id}
                  style={styles.serviceRow}
                  onPress={() =>
                    openService(service.id)
                  }
                >
                  <View style={styles.serviceIcon}>
                    <FileText
                      size={22}
                      color={COLORS.navy}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={styles.serviceTitle}
                      numberOfLines={2}
                    >
                      {service.title}
                    </Text>

                    <Text style={styles.serviceMeta}>
                      {formatDate(service.date)}
                      {' · '}
                      {formatMileage(
                        service.mileage,
                      )}
                    </Text>
                  </View>

                  <ChevronRight
                    size={21}
                    color="#A1B8CA"
                  />
                </Pressable>
              ))
            )}
          </View>

          <Pressable
            onPress={openNewService}
            style={styles.addServiceButton}
          >
            <Plus
              size={20}
              color={COLORS.navy}
            />

            <Text style={styles.addServiceText}>
              Add Service
            </Text>
          </Pressable>

          {/* DELETE CAR */}

          <Pressable
            onPress={handleDelete}
            disabled={deleteCar.isPending}
            style={styles.deleteButton}
          >
            {deleteCar.isPending ? (
              <ActivityIndicator
                color={COLORS.red}
              />
            ) : (
              <Trash2
                size={18}
                color={COLORS.red}
              />
            )}

            <Text style={styles.deleteText}>
              Delete Car
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  centerScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 18,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
  },

  primaryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: COLORS.yellow,
    borderRadius: 14,
  },

  primaryButtonText: {
    color: COLORS.navy,
    fontWeight: '800',
  },

  backLink: {
    color: COLORS.blue,
    fontWeight: '700',
  },

  hero: {
    height: 310,
    backgroundColor: COLORS.sky,
    overflow: 'hidden',
  },

  topBar: {
    height: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  topButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  topTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },

  heroTextCard: {
    alignSelf: 'flex-start',
    marginTop: 24,
    marginHorizontal: 22,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },

  heroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.blue,
    marginBottom: 7,
  },

  carName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.6,
  },

  carYear: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },

  content: {
    marginTop: -22,
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  mileageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    padding: 17,
  },

  mileageIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E8F5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mileageLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 5,
  },

  mileageValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
  },

  smallEditButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F7FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },

  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 19,
    padding: 13,
    alignItems: 'center',
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F0F8FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  statNumber: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.navy,
  },

  statLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.4,
    marginTop: 28,
    marginBottom: 14,
  },

  sectionHeading: {
    marginTop: 4,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: -7,
    marginBottom: 15,
  },

  infoCard: {
    paddingHorizontal: 17,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  infoRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  infoLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },

  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'right',
  },

  loadingCard: {
    padding: 30,
    backgroundColor: COLORS.white,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mutedText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
  },

  emptyCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 23,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 19,
    backgroundColor: '#EAF7F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
  },

  emptyDescription: {
    marginTop: 9,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.muted,
    textAlign: 'center',
  },

  emptyAction: {
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: COLORS.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  emptyActionText: {
    color: COLORS.navy,
    fontSize: 14,
    fontWeight: '800',
  },

  maintenanceList: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    overflow: 'hidden',
  },

  maintenanceItem: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  maintenanceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EAF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  maintenanceBody: {
    flex: 1,
  },

  maintenanceName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },

  maintenanceInterval: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 5,
  },

  maintenanceStatus: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },

  nextDueText: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },

  manageButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: COLORS.yellow,
    marginTop: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  manageButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
  },

  serviceCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 17,
    overflow: 'hidden',
  },

  serviceHeader: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  serviceHeaderIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: '#EAF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  serviceCount: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
    marginBottom: 5,
  },

  serviceRow: {
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  serviceIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#F1F7FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  serviceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },

  serviceMeta: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.muted,
  },

  serviceEmpty: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },

  addServiceButton: {
    minHeight: 54,
    marginTop: 15,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  addServiceText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },

  deleteButton: {
    marginTop: 30,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.red,
  },
});
