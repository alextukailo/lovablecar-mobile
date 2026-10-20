
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    AlertCircle,
    CalendarClock,
    CarFront,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    FileText,
    Gauge,
    Plus,
    Wrench,
} from 'lucide-react-native';

import {
    Animated,
    Image,
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { api } from '../../../lib/api';
import { useCarMaintenanceSchedules } from '../../../lib/maintenance.queries';
import { useAuth } from '../../auth/AuthContext';
import { useProfileMenu } from '../../components/ProfileMenuContext';
import { useCars } from '../../features/cars/hooks/useCars';

import {
    formatMaintenanceDeadline,
    getMaintenanceName,
} from '../../features/maintenance/utils/maintenance-display';

import { calculateMaintenanceOverview } from '../../features/maintenance/utils/maintenance-overview';
import { findNextMaintenance } from '../../features/maintenance/utils/next-maintenance';
import { useCarStore } from '../../store/car.store';

const C = {
  navy: '#102C4B',
  blue: '#1789E8',
  muted: '#7793AF',
  sky: '#DDF2FF',
  white: '#FFFFFF',
  yellow: '#FFD23F',
  border: '#E7EFF6',
  red: '#D75A4C',
  green: '#218C83',
};

const HEADER_HEIGHT = 64;

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

function SectionHeader({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {action && onPress && (
        <Pressable
          onPress={onPress}
          style={styles.sectionAction}
        >
          <Text style={styles.sectionLink}>
            {action}
          </Text>

          <ChevronRight
            size={16}
            color={C.navy}
          />
        </Pressable>
      )}
    </View>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  onPress,
}: {
  icon: typeof Gauge;
  value: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.statCard}
      onPress={onPress}
    >
      <View style={styles.statIcon}>
        <Icon
          size={21}
          color={C.navy}
          strokeWidth={1.8}
        />
      </View>

      <Text
        style={styles.statValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <Text
        style={styles.statLabel}
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { user } = useAuth();
  const { openProfile } = useProfileMenu();

  const [avatarError, setAvatarError] = useState(false);

  const photoUrl = user?.photoUrl || null;

  useEffect(() => {
    setAvatarError(false);
  }, [photoUrl]);

  const initials = (
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join('') ||
    user?.username?.[0] ||
    'U'
  ).toUpperCase();

  const scrollY = useRef(
    new Animated.Value(0),
  ).current;

  const headerBackground = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [
      'rgba(221,242,255,0)',
      'rgba(221,242,255,0.97)',
    ],
    extrapolate: 'clamp',
  });

  // CARS

  const {
    data: cars = [],
    isLoading: loadingCars,
    isError: carsError,
    refetch: refetchCars,
  } = useCars();

  const selectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectedCar =
    cars.find((car) => car.id === selectedCarId) ??
    cars.find((car) => car.isPrimary) ??
    cars[0] ??
    null;

  const carId = selectedCar?.id;

  // SERVICES

  const {
    data: services = [],
    isLoading: loadingServices,
    isError: servicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['cars', carId, 'services'],
    enabled: Boolean(carId),
    queryFn: () => fetchCarServices(carId!),
  });

  // MAINTENANCE

  const {
    data: schedules = [],
    isLoading: loadingMaintenance,
    isError: maintenanceError,
  } = useCarMaintenanceSchedules(carId ?? '');

  const maintenanceOverview =
    calculateMaintenanceOverview(
      schedules,
      selectedCar?.mileage ?? 0,
    );

  const attentionCount =
    maintenanceOverview.counts.overdue +
    maintenanceOverview.counts.dueSoon;

  const nextMaintenance = selectedCar
    ? findNextMaintenance(
        schedules,
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

  // NAVIGATION

  const openCar = () => {
    if (!carId) {
      router.push('/(tabs)/cars');
      return;
    }

    router.push({
      pathname: '/car/[id]',
      params: { id: carId },
    });
  };

  const openMaintenance = () => {
    if (!carId) {
      router.push('/(tabs)/cars');
      return;
    }

    if (nextMaintenance) {
      router.push({
        pathname: '/maintenance/[id]',
        params: {
          id: nextMaintenance.schedule.id,
          carId,
        },
      });
      return;
    }

    openCar();
  };

  const addService = () => {
    if (!carId) {
      router.push('/(tabs)/cars');
      return;
    }

    router.push({
      pathname: '/service/new',
      params: { vehicleId: carId },
    });
  };

  const maintenanceTitle = !selectedCar
    ? t('home.noCar')
    : loadingMaintenance
      ? t('home.loadingMaintenance')
      : maintenanceError
        ? t('home.maintenanceUnavailable')
        : nextMaintenance
          ? getMaintenanceName(nextMaintenance.schedule)
          : t('home.notConfigured');

  const maintenanceDescription = !selectedCar
    ? t('home.selectCar')
    : loadingMaintenance
      ? t('home.checkingSchedules')
      : maintenanceError
        ? t('home.maintenanceError')
        : nextMaintenance
          ? formatMaintenanceDeadline(
              nextMaintenance.result,
            )
          : t('home.setupMaintenance');

  return (
    <ImageBackground
      source={require(
        '../../../assets/images/lovablecar-main-background.png'
      )}
      style={styles.screen}
      resizeMode="cover"
      blurRadius={18}
    >
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{
            nativeEvent: {
              contentOffset: { y: scrollY },
            },
          }],
          { useNativeDriver: false },
        )}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop:
              insets.top + HEADER_HEIGHT + 18,
            paddingBottom: insets.bottom + 100,
          },
        ]}
      >
        {/* VEHICLE */}

        <SectionHeader
          title={t('home.vehicleOverview')}
          action={t('home.seeAll')}
          onPress={() => router.push('/(tabs)/cars')}
        />

        <Pressable
          style={styles.vehicleCard}
          onPress={openCar}
        >
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleIcon}>
              <CarFront
                size={23}
                color={C.navy}
              />
            </View>

            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {loadingCars
                  ? t('home.loadingCar')
                  : selectedCar
                    ? `${selectedCar.make} ${selectedCar.model}`
                    : t('home.noCar')}
              </Text>

              <Text style={styles.vehicleSubtitle}>
                {selectedCar
                  ? `${selectedCar.year}${
                      selectedCar.engine
                        ? ` · ${selectedCar.engine}`
                        : ''
                    }`
                  : t('home.tapManage')}
              </Text>
            </View>

            <ChevronRight
              size={21}
              color={C.muted}
            />
          </View>

          <Image
            source={require(
              '../../../assets/images/lovablecar-background.png'
            )}
            style={styles.vehicleImage}
            resizeMode="cover"
          />

          <View style={styles.vehicleFooter}>
            <View style={styles.vehicleFooterLeft}>
              {selectedCar?.isPrimary && (
                <>
                  <CheckCircle2
                    size={16}
                    color={C.green}
                  />
                  <Text style={styles.primaryText}>
                    {t('cars.primary')}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.vehicleFooterRight}>
              <Text style={styles.detailsText}>
                {t('home.viewDetails')}
              </Text>
              <ChevronRight
                size={16}
                color={C.navy}
              />
            </View>
          </View>
        </Pressable>

        {carsError && (
          <Pressable
            style={styles.errorCard}
            onPress={() => void refetchCars()}
          >
            <AlertCircle size={18} color={C.red} />
            <Text style={styles.errorText}>
              {t('home.carsError')}
            </Text>
          </Pressable>
        )}

        {/* STATISTICS */}

        <View style={styles.statsRow}>
          <StatCard
            icon={Gauge}
            value={
              selectedCar
                ? selectedCar.mileage.toLocaleString()
                : '—'
            }
            label={t('cars.mileage') + ' (km)'}
            onPress={openCar}
          />

          <StatCard
            icon={ClipboardList}
            value={
              loadingServices
                ? '—'
                : String(services.length)
            }
            label={t('navigation.services')}
            onPress={() =>
              router.push('/(tabs)/services')
            }
          />

          <StatCard
            icon={CalendarClock}
            value={
              loadingMaintenance || maintenanceError
                ? '—'
                : String(attentionCount)
            }
            label={t('home.attention')}
            onPress={openMaintenance}
          />
        </View>

        {/* UPCOMING SERVICE */}

        <SectionHeader
          title={t('home.upcomingService')}
          action={t('home.seeAll')}
          onPress={openCar}
        />

        <Pressable
          style={styles.maintenanceCard}
          onPress={openMaintenance}
        >
          <View style={styles.maintenanceIcon}>
            <Wrench
              size={24}
              color={C.navy}
            />
          </View>

          <View style={styles.maintenanceInfo}>
            <Text style={styles.maintenanceTitle}>
              {maintenanceTitle}
            </Text>

            <Text style={styles.maintenanceDescription}>
              {maintenanceDescription}
            </Text>

            {nextMaintenance?.result.label && (
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>
                  {nextMaintenance.result.label}
                </Text>
              </View>
            )}
          </View>

          <ChevronRight
            size={20}
            color={C.muted}
          />
        </Pressable>

        {/* RECENT SERVICES */}

        <SectionHeader
          title={t('home.recentServices')}
          action={t('home.seeAll')}
          onPress={() =>
            router.push('/(tabs)/services')
          }
        />

        <View style={styles.servicesCard}>
          {recentServices.length > 0 ? (
            recentServices.map((service, index) => (
              <Pressable
                key={service.id}
                style={[
                  styles.serviceRow,
                  index < recentServices.length - 1 &&
                    styles.serviceDivider,
                ]}
                onPress={() => {
                  router.push({
                    pathname: '/service/[id]',
                    params: {
                      id: service.id,
                      serviceId: service.id,
                      carId: service.carId || carId,
                    },
                  });
                }}
              >
                <View style={styles.serviceIcon}>
                  <Wrench
                    size={21}
                    color={C.navy}
                  />
                </View>

                <View style={styles.serviceInfo}>
                  <Text
                    style={styles.serviceTitle}
                    numberOfLines={2}
                  >
                    {service.title}
                  </Text>

                  <Text style={styles.serviceSubtitle}>
                    {new Date(
                      service.date,
                    ).toLocaleDateString()}
                    {' · '}
                    {service.mileage.toLocaleString()} km
                  </Text>
                </View>

                <ChevronRight
                  size={19}
                  color={C.muted}
                />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyServices}>
              <FileText
                size={30}
                color={C.muted}
              />

              <Text style={styles.emptyText}>
                {loadingServices
                  ? t('home.loadingServices')
                  : servicesError
                    ? t('home.servicesUnavailable')
                    : t('home.noServices')}
              </Text>

              {servicesError && (
                <Pressable
                  onPress={() =>
                    void refetchServices()
                  }
                >
                  <Text style={styles.retryText}>
                    {t('common.retry')}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* ADD SERVICE */}

        <Pressable
          style={styles.addButton}
          onPress={addService}
        >
          <Plus
            size={22}
            color={C.navy}
            strokeWidth={2.5}
          />

          <Text style={styles.addButtonText}>
            {t('services.addService')}
          </Text>
        </Pressable>
      </Animated.ScrollView>

      {/* FIXED HEADER */}

      <Animated.View
        style={[
          styles.header,
          {
            height: insets.top + HEADER_HEIGHT,
            paddingTop: insets.top,
            backgroundColor: headerBackground,
          },
        ]}
      >
        <Text style={styles.headerTitle}>
          LovableCar
        </Text>

        <Pressable
          onPress={openProfile}
          style={styles.avatarButton}
          accessibilityRole="button"
          accessibilityLabel={t('home.openProfile')}
        >
          {photoUrl && !avatarError ? (
            <Image
              source={{ uri: photoUrl }}
              style={styles.avatar}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {initials}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: C.sky,
  },
  content: {
    paddingHorizontal: 18,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.7,
    color: C.navy,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.white,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.navy,
  },
  sectionHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: C.navy,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingLeft: 8,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
    color: C.navy,
  },
  vehicleCard: {
    backgroundColor: C.white,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: C.border,
  },
  vehicleHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#EAF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '800',
    color: C.navy,
  },
  vehicleSubtitle: {
    fontSize: 13,
    color: C.muted,
    marginTop: 4,
  },
  vehicleImage: {
    width: '100%',
    height: 155,
  },
  vehicleFooter: {
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vehicleFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  primaryText: {
    color: C.green,
    fontSize: 12,
    fontWeight: '700',
  },
  vehicleFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.navy,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 27,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: C.white,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    minHeight: 126,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EAF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    marginTop: 11,
    fontSize: 19,
    fontWeight: '800',
    color: C.navy,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 15,
    color: C.muted,
    textAlign: 'center',
    marginTop: 5,
  },
  maintenanceCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 27,
  },
  maintenanceIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: '#FFF0B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maintenanceInfo: {
    flex: 1,
  },
  maintenanceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.navy,
  },
  maintenanceDescription: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: C.muted,
  },
  statusPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#FFF0B8',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.navy,
  },
  servicesCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  serviceRow: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  serviceDivider: {
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  serviceIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#EAF6FF',
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
  serviceSubtitle: {
    fontSize: 12,
    color: C.muted,
    marginTop: 6,
  },
  emptyServices: {
    padding: 26,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
  },
  retryText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.blue,
  },
  addButton: {
    marginTop: 22,
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: C.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.navy,
  },
  errorCard: {
    backgroundColor: '#FFF0EF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: C.red,
    flex: 1,
  },
});
