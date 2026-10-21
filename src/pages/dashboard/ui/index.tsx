
import { C, styles } from '@/pages/dashboard/ui/index.styles';

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
    Text,
    View,
} from 'react-native';

import { api } from '@/../lib/api';
import { useCarMaintenanceSchedules } from '@/../lib/maintenance.queries';
import { useAuth } from '@/features/auth/model/AuthContext';
import { useCarPhoto } from '@/features/cars/model/useCarPhoto';
import { useCars } from '@/features/cars/model/useCars';
import { useProfileMenu } from '@/shared/ui/ProfileMenuContext';

import {
    formatMaintenanceDeadline,
    getMaintenanceName,
} from '@/features/maintenance/lib/maintenance-display';

import { useCarStore } from '@/entities/car/model/car.store';
import { calculateMaintenanceOverview } from '@/features/maintenance/lib/maintenance-overview';
import { findNextMaintenance } from '@/features/maintenance/lib/next-maintenance';

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
  const [carImageError, setCarImageError] = useState(false);

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

  // CAR PHOTO

  const {
    data: carPhoto,
  } = useCarPhoto(carId);

  const carPhotoUrl = carPhoto?.url ?? null;

  useEffect(() => {
    setCarImageError(false);
  }, [carPhotoUrl]);

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
        '../../../../assets/images/lovablecar-main-background.png'
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

          {/* VEHICLE PHOTO */}

          <Image
            source={
              carPhotoUrl && !carImageError
                ? { uri: carPhotoUrl }
                : require(
                    '../../../../assets/images/lovablecar-background.png'
                  )
            }
            style={styles.vehicleImage}
            resizeMode="cover"
            onError={() => setCarImageError(true)}
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
