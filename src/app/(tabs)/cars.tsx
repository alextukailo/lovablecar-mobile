
import { useQuery } from '@tanstack/react-query';
import { router, useNavigation } from 'expo-router';
import {
    Bell,
    CalendarDays,
    CarFront,
    ChevronRight,
    Gauge,
    Plus,
    Wrench,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { api } from '../../../lib/api';
import { useCarMaintenanceSchedules } from '../../../lib/maintenance.queries';
import { useCars } from '../../features/cars/hooks/useCars';
import { useCarStore } from '../../store/car.store';

const C = {
  navy: '#0A2444',
  blue: '#1878D5',
  muted: '#5E7FA3',
  yellow: '#FFCA24',
  white: '#FFFFFF',
  border: '#E4EDF5',
  background: '#F5FAFF',
  sky: '#DDF2FF',
};

type Service = {
  id: string;
  title: string;
  date: string;
  mileage: number;
  cost?: string | number | null;
  currency?: string | null;
};

const formatNumber = (value: number) =>
  value.toLocaleString('en-US').replace(/,/g, ' ');

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

function useServices(carId?: string) {
  return useQuery({
    queryKey: ['services', carId],
    enabled: !!carId,
    queryFn: async () => {
      const { data } = await api.get<Service[]>(
        `/cars/${carId}/services`
      );
      return data;
    },
  });
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeading}>
        {icon}
        <Text style={styles.statValue}>{value}</Text>
      </View>

      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <Pressable onPress={onPress}>
        <Text style={styles.seeAll}>See all</Text>
      </Pressable>
    </View>
  );
}

function maintenanceName(type: string) {
  const names: Record<string, string> = {
    ENGINE_OIL: 'Oil change',
    TRANSMISSION_OIL: 'Transmission oil',
    BRAKE_FLUID: 'Brake fluid',
    HALDEX_OIL: 'Haldex oil',
    ENGINE_AIR_FILTER: 'Air filter replacement',
    CABIN_FILTER: 'Cabin filter',
    FUEL_FILTER: 'Fuel filter',
    SPARK_PLUGS: 'Spark plugs',
    COOLANT: 'Coolant replacement',
    TIMING_BELT: 'Timing belt',
  };

  return (
    names[type] ??
    type.replace(/_/g, ' ').toLowerCase()
  );
}

export default function CarsScreen() {
  const navigation = useNavigation();

  // Hide the default Expo Router header.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const {
    data: cars = [],
    isLoading,
    isError,
    refetch,
  } = useCars();

  const selectedId = useCarStore(
    (state) => state.selectedCarId
  );

  const car =
    cars.find((c) => c.id === selectedId) ??
    cars.find((c) => c.isPrimary) ??
    cars[0];

  const { data: services = [] } = useServices(car?.id);

  const { data: schedules = [] } =
    useCarMaintenanceSchedules(car?.id);

  const enabledSchedules = schedules.filter(
    (schedule) => schedule.enabled
  );

  const upcoming = [...enabledSchedules].sort((a, b) => {
    const kmA =
      a.nextDueMileage == null
        ? Infinity
        : a.nextDueMileage - (car?.mileage ?? 0);

    const kmB =
      b.nextDueMileage == null
        ? Infinity
        : b.nextDueMileage - (car?.mileage ?? 0);

    return kmA - kmB;
  })[0];

  const latest = [...services].sort(
    (a, b) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  )[0];

  const dueText = upcoming
    ? upcoming.nextDueMileage != null
      ? `in ${formatNumber(
          Math.max(
            0,
            upcoming.nextDueMileage - (car?.mileage ?? 0)
          )
        )} km`
      : upcoming.nextDueDate
        ? `by ${formatDate(upcoming.nextDueDate)}`
        : 'Schedule configured'
    : '';

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={C.blue}
        />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          Could not load your cars.
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => void refetch()}
        >
          <Text style={styles.retryText}>
            Try again
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
      {/* HERO BACKGROUND */}
      <ImageBackground
        source={require('../../../assets/images/cars-hero.png')}
        style={styles.hero}
        imageStyle={styles.heroImage}
        resizeMode="cover"
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>My Cars</Text>

          <Pressable
            style={styles.addButton}
            onPress={() => router.push('/car/new')}
          >
            <Plus
              size={25}
              color={C.white}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        {/* CAR SELECTOR */}
        {car ? (
          <Pressable
            style={styles.carSelector}
            onPress={() =>
              router.push({
                pathname: '/car/[id]',
                params: { id: car.id },
              })
            }
          >
            <View style={styles.brandIcon}>
              <CarFront
                size={27}
                color={C.blue}
                strokeWidth={2}
              />
            </View>

            <View style={styles.carInfo}>
              <Text
                style={styles.carName}
                numberOfLines={1}
              >
                {car.make} {car.model}
              </Text>

              <Text style={styles.carSubtitle}>
                {car.year}
                {car.engine
                  ? ` · ${car.engine}`
                  : ''}
              </Text>
            </View>

            <ChevronRight
              size={21}
              color={C.muted}
            />
          </Pressable>
        ) : (
          <View style={styles.emptyCar}>
            <CarFront
              size={40}
              color={C.blue}
            />

            <Text style={styles.carName}>
              No cars yet
            </Text>

            <Pressable
              onPress={() => router.push('/car/new')}
            >
              <Text style={styles.emptyCarLink}>
                Add your first car
              </Text>
            </Pressable>
          </View>
        )}

        {/* SPACE FOR THE CAR IN THE BACKGROUND IMAGE */}
        <View style={styles.heroSpacer} />
      </ImageBackground>

      {/* MAIN CONTENT */}
      {car && (
        <>
          {/* STATISTICS */}
          <View style={styles.statsRow}>
            <StatCard
              icon={
                <Gauge
                  size={19}
                  color={C.navy}
                />
              }
              value={formatNumber(car.mileage)}
              label="Mileage, km"
            />

            <StatCard
              icon={
                <CalendarDays
                  size={19}
                  color={C.navy}
                />
              }
              value={String(services.length)}
              label="Services"
            />

            <StatCard
              icon={
                <Bell
                  size={19}
                  color="#D69B00"
                />
              }
              value={String(enabledSchedules.length)}
              label="Scheduled"
            />
          </View>

          {/* UPCOMING SERVICE */}
          <SectionHeader
            title="Upcoming Service"
            onPress={() =>
              router.push({
                pathname: '/car/[id]',
                params: { id: car.id },
              })
            }
          />

          {upcoming ? (
            <Pressable
              style={styles.upcomingCard}
              onPress={() =>
                router.push({
                  pathname: '/maintenance/[id]',
                  params: {
                    id: upcoming.id,
                    carId: car.id,
                  },
                })
              }
            >
              <View style={styles.yellowIcon}>
                <Wrench
                  size={23}
                  color={C.navy}
                />
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  {upcoming.customTitle ??
                    maintenanceName(upcoming.type)}
                </Text>

                <Text style={styles.cardSubtitle}>
                  {dueText}
                </Text>
              </View>

              <ChevronRight
                size={20}
                color={C.muted}
              />
            </Pressable>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.cardSubtitle}>
                No upcoming maintenance configured
              </Text>
            </View>
          )}

          {/* RECENT SERVICES */}
          <SectionHeader
            title="Recent Services"
            onPress={() =>
              router.push('/(tabs)/services')
            }
          />

          {latest ? (
            <Pressable
              style={styles.serviceCard}
              onPress={() =>
                router.push({
                  pathname: '/service/[id]',
                  params: { id: latest.id },
                })
              }
            >
              <View style={styles.serviceIcon}>
                <Wrench
                  size={21}
                  color={C.blue}
                />
              </View>

              <View style={styles.serviceInfo}>
                <Text
                  style={styles.serviceTitle}
                  numberOfLines={1}
                >
                  {latest.title}
                </Text>

                <Text style={styles.serviceMeta}>
                  {formatDate(latest.date)}
                  {' · '}
                  {formatNumber(latest.mileage)} km
                </Text>
              </View>

              <Text style={styles.serviceCost}>
                {latest.cost != null
                  ? `${Number(latest.cost).toFixed(2)} ${
                      latest.currency ?? 'PLN'
                    }`
                  : '—'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.cardSubtitle}>
                No service records yet
              </Text>
            </View>
          )}

          {/* ADD SERVICE BUTTON */}
          <Pressable
            style={styles.newServiceButton}
            onPress={() =>
              router.push('/service/new')
            }
          >
            <Plus
              size={22}
              color={C.navy}
              strokeWidth={2.5}
            />

            <Text style={styles.newServiceText}>
              Add Service
            </Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },

  content: {
    paddingBottom: 36,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.background,
  },

  errorText: {
    color: C.navy,
    fontSize: 15,
  },

  retryButton: {
    marginTop: 15,
    padding: 12,
  },

  retryText: {
    color: C.blue,
    fontWeight: '700',
  },

  // HERO

  hero: {
    paddingTop: 24,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: C.sky,
  },

  heroImage: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    transform: 'translate(-470px, -371px) scale(0.4)',
  },

  heroSpacer: {
    height: 215,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  title: {
    fontSize: 29,
    fontWeight: '800',
    color: C.navy,
    letterSpacing: -0.8,
  },

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: C.navy,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 3,
    },
  },

  // CAR SELECTOR

  carSelector: {
    minHeight: 76,
    backgroundColor: C.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },

  brandIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: C.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  carInfo: {
    flex: 1,
  },

  carName: {
    fontSize: 17,
    fontWeight: '800',
    color: C.navy,
  },

  carSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: C.muted,
  },

  emptyCar: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },

  emptyCarLink: {
    fontSize: 14,
    fontWeight: '700',
    color: C.blue,
  },

  // STATISTICS

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 7,
    marginTop: 14,
    marginBottom: 28,
  },

  statCard: {
    flex: 1,
    minHeight: 82,
    backgroundColor: C.white,
    borderRadius: 15,
    paddingHorizontal: 6,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: C.navy,
  },

  statLabel: {
    marginTop: 7,
    fontSize: 11,
    color: C.muted,
    textAlign: 'center',
  },

  // SECTIONS

  sectionHeader: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.navy,
    letterSpacing: -0.3,
  },

  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: C.blue,
  },

  // UPCOMING SERVICE

  upcomingCard: {
    marginHorizontal: 16,
    marginBottom: 28,
    minHeight: 82,
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#FFF6DB',
    borderWidth: 1,
    borderColor: '#FFE5A0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  yellowIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.navy,
  },

  cardSubtitle: {
    fontSize: 13,
    color: C.muted,
    marginTop: 5,
  },

  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 28,
    padding: 20,
    minHeight: 70,
    backgroundColor: C.white,
    borderRadius: 16,
    justifyContent: 'center',
  },

  // RECENT SERVICES

  serviceCard: {
    marginHorizontal: 16,
    minHeight: 83,
    borderRadius: 16,
    padding: 13,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  serviceIcon: {
    width: 34,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  serviceInfo: {
    flex: 1,
  },

  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.navy,
  },

  serviceMeta: {
    marginTop: 6,
    fontSize: 11,
    color: C.muted,
  },

  serviceCost: {
    fontSize: 12,
    fontWeight: '800',
    color: C.navy,
  },

  // ADD SERVICE

  newServiceButton: {
    marginHorizontal: 16,
    marginTop: 25,
    height: 54,
    borderRadius: 17,
    backgroundColor: C.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  newServiceText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.navy,
  },
});
