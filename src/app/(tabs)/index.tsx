
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/AuthContext';
import { useProfileMenu } from '../../components/ProfileMenuContext';

import {
    AlertCircle,
    Bell,
    CalendarClock,
    CarFront,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    FileText,
    Gauge,
    LogOut,
    Plus,
    UserRound,
    Wrench,
    X,
} from 'lucide-react-native';

import {
    Animated,
    Image,
    ImageBackground,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { api } from '../../../lib/api';
import { useCarMaintenanceSchedules } from '../../../lib/maintenance.queries';
import { useCars } from '../../features/cars/hooks/useCars';
import {
    formatMaintenanceDeadline,
    getMaintenanceName,
} from '../../features/maintenance/utils/maintenance-display';
import { calculateMaintenanceOverview } from '../../features/maintenance/utils/maintenance-overview';
import { findNextMaintenance } from '../../features/maintenance/utils/next-maintenance';
import { useCarStore } from '../../store/car.store';

const COLORS = {
  navy: '#092747',
  blue: '#1476C8',
  muted: '#5E7B99',
  sky: '#DDF2FF',
  white: '#FFFFFF',
  yellow: '#FFCC32',
  border: '#E0EDF6',
  red: '#D75A4C',
  amber: '#D39B10',
  green: '#218C83',
};

const HEADER_HEIGHT = 64;

// -----------------------------------
// TYPES
// -----------------------------------

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

// -----------------------------------
// API
// -----------------------------------

async function fetchCarServices(
  carId: string,
): Promise<ApiService[]> {
  const response = await api.get<ApiService[]>(
    `/cars/${carId}/services`,
  );

  return response.data;
}

// -----------------------------------
// HOME SCREEN
// -----------------------------------

export default function HomeScreen() {
  const { t } = useTranslation();
  // -----------------------------------
  // SAFE AREA
  // -----------------------------------

  const insets = useSafeAreaInsets();

  const topInset = insets.top;
  const totalHeaderHeight = topInset + HEADER_HEIGHT;

  // -----------------------------------
  // AUTHENTICATION
  // -----------------------------------

  const { user, logout } = useAuth();
  const { openProfile } = useProfileMenu();

  // -----------------------------------
  // TELEGRAM AVATAR
  // -----------------------------------

  const [avatarError, setAvatarError] = useState(false);

  const photoUrl = user?.photoUrl || null;

  useEffect(() => {
    setAvatarError(false);
  }, [photoUrl]);

  const showAvatar = Boolean(
    photoUrl && !avatarError,
  );

  const initials = (
    [user?.firstName?.[0], user?.lastName?.[0]]
      .filter(Boolean)
      .join('') ||
    user?.username?.[0] ||
    'U'
  ).toUpperCase();

  const displayName =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ') ||
    user?.username ||
    t('profile.title');

  // -----------------------------------
  // PROFILE MENU
  // -----------------------------------

  const [profileVisible, setProfileVisible] =
    useState(false);

  const closeProfile = () => {
    setProfileVisible(false);
  };

  const openMore = () => {
    closeProfile();
    router.push('/(tabs)/more');
  };

  const openTelegramSettings = () => {
    closeProfile();
    router.push('/(tabs)/more');
  };

  const handleLogout = async () => {
    closeProfile();

    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // -----------------------------------
  // ANIMATED HEADER
  // -----------------------------------

  const scrollY = useRef(
    new Animated.Value(0),
  ).current;

  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [
      'rgba(255,204,50,0)',
      'rgba(255,204,50,1)',
    ],
    extrapolate: 'clamp',
  });

  // -----------------------------------
  // CARS
  // -----------------------------------

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

  // -----------------------------------
  // SERVICES
  // -----------------------------------

  const {
    data: services = [],
    isLoading: isLoadingServices,
    isError: isServicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: [
      'cars',
      selectedCarId,
      'services',
    ],
    queryFn: () =>
      fetchCarServices(selectedCarId!),
    enabled: Boolean(selectedCarId),
  });

  // -----------------------------------
  // MAINTENANCE
  // -----------------------------------

  const {
    data: maintenanceSchedules = [],
    isLoading: isLoadingMaintenance,
    isError: isMaintenanceError,
  } = useCarMaintenanceSchedules(
    selectedCarId ?? '',
  );

  const maintenanceOverview =
    calculateMaintenanceOverview(
      maintenanceSchedules,
      selectedCar?.mileage ?? 0,
    );

  const maintenanceCounts =
    maintenanceOverview.counts;

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

  const maintenanceAttentionCount =
    maintenanceCounts.dueSoon +
    maintenanceCounts.overdue;

  // -----------------------------------
  // NAVIGATION
  // -----------------------------------

  const openSelectedCar = () => {
    if (selectedCarId) {
      router.push({
        pathname: '/car/[id]',
        params: {
          id: selectedCarId,
        },
      });
    } else {
      router.push('/(tabs)/cars');
    }
  };

  const openNextMaintenance = () => {
    if (!selectedCarId) {
      router.push('/(tabs)/cars');
      return;
    }

    if (nextMaintenance) {
      router.push({
        pathname: '/maintenance/[id]',
        params: {
          id: nextMaintenance.schedule.id,
          carId: selectedCarId,
        },
      });
      return;
    }

    router.push({
      pathname: '/car/[id]',
      params: {
        id: selectedCarId,
      },
    });
  };

  const handleAddService = () => {
    if (!selectedCarId) {
      router.push('/(tabs)/cars');
      return;
    }

    router.push({
      pathname: '/service/new',
      params: {
        vehicleId: selectedCarId,
      },
    });
  };

  // -----------------------------------
  // DISPLAY VALUES
  // -----------------------------------

  const nextServiceTitle = !selectedCar
    ? t('home.noCar')
    : isLoadingMaintenance
      ? t('home.loadingMaintenance')
      : isMaintenanceError
        ? t('home.maintenanceUnavailable')
        : nextMaintenance
          ? getMaintenanceName(
              nextMaintenance.schedule,
            )
          : t('home.notConfigured');

  const nextServiceDescription = !selectedCar
    ? t('home.selectCar')
    : isLoadingMaintenance
      ? t('home.checkingSchedules')
      : isMaintenanceError
        ? t('home.maintenanceError')
        : nextMaintenance
          ? formatMaintenanceDeadline(
              nextMaintenance.result,
            )
          : t('home.setupMaintenance');

  const nextServiceStatus =
    nextMaintenance?.result.label ?? null;

  // -----------------------------------
  // RENDER
  // -----------------------------------

  return (
    <ImageBackground
      source={require(
        '../../../assets/images/lovablecar-main-background.png'
      )}
      style={styles.screen}
      resizeMode="cover"
      blurRadius={7}
    >
      {/* SCROLLABLE CONTENT */}

      <Animated.ScrollView
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y: scrollY,
                },
              },
            },
          ],
          {
            useNativeDriver: false,
          },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: totalHeaderHeight + 20,
          },
        ]}
      >
        {/* VEHICLE CARD */}

        <Pressable
          style={styles.vehicleCard}
          onPress={openSelectedCar}
        >
          <View style={styles.vehicleCardTop}>
            <View style={styles.vehicleBadge}>
              <CarFront
                size={25}
                color={COLORS.blue}
                strokeWidth={2}
              />
            </View>

            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleName}>
                {isLoadingCars
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
              color={COLORS.muted}
            />
          </View>

          {selectedCar && (
            <Image
              source={require(
                '../../../assets/images/lovablecar-background.png'
              )}
              style={styles.vehicleIllustration}
              resizeMode="cover"
            />
          )}

          <View style={styles.vehicleCardFooter}>
            <View style={styles.vehicleFooterLeft}>
              <CheckCircle2
                size={14}
                color={COLORS.green}
                strokeWidth={2.2}
              />

              <Text style={styles.vehicleFooterText}>
                {t('home.vehicleOverview')}
              </Text>
            </View>

            <View style={styles.vehicleFooterRight}>
              <Text style={styles.vehicleFooterLink}>
                {t('home.viewDetails')}
              </Text>

              <ChevronRight
                size={15}
                color={COLORS.blue}
              />
            </View>
          </View>
        </Pressable>

        {/* ERROR */}

        {isCarsError && (
          <Pressable
            style={styles.errorCard}
            onPress={() =>
              void refetchCars()
            }
          >
            <AlertCircle
              size={17}
              color="#B91C1C"
            />

            <Text style={styles.errorText}>
                {t('home.carsError')}
              </Text>
          </Pressable>
        )}

        {/* STATISTICS */}

        <View style={styles.statsRow}>
          <Pressable
            style={styles.statCard}
            onPress={openSelectedCar}
          >
            <View style={styles.statIconBlue}>
              <Gauge
                size={20}
                color={COLORS.blue}
              />
            </View>

            <Text
              style={styles.statValue}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {selectedCar
                ? selectedCar.mileage.toLocaleString()
                : '—'}
            </Text>

            <Text style={styles.statLabel}>
                {t('cars.mileage')}
              </Text>

            <Text style={styles.statUnit}>
              km
            </Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={() =>
              router.push('/(tabs)/services')
            }
          >
            <View style={styles.statIconBlue}>
              <ClipboardList
                size={20}
                color={COLORS.blue}
              />
            </View>

            <Text style={styles.statValue}>
              {services.length}
            </Text>

            <Text style={styles.statLabel}>
                {t('navigation.services')}
              </Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={openNextMaintenance}
          >
            <View style={styles.statIconYellow}>
              <CalendarClock
                size={20}
                color={COLORS.navy}
              />
            </View>

            <Text style={styles.statValue}>
              {maintenanceAttentionCount}
            </Text>

            <Text style={styles.statLabel}>
                {t('home.attention')}
              </Text>
          </Pressable>
        </View>

        {/* UPCOMING SERVICE */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
                {t('home.upcomingService')}
              </Text>

          <Pressable onPress={openSelectedCar}>
            <Text style={styles.sectionLink}>
                {t('home.seeAll')}
              </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.maintenanceCard}
          onPress={openNextMaintenance}
        >
          <View style={styles.maintenanceIcon}>
            <Wrench
              size={24}
              color={COLORS.navy}
            />
          </View>

          <View style={styles.maintenanceInfo}>
            <Text style={styles.maintenanceTitle}>
              {nextServiceTitle}
            </Text>

            <Text style={styles.maintenanceSubtitle}>
              {nextServiceDescription}
            </Text>

            {nextServiceStatus && (
              <Text style={styles.maintenanceStatus}>
                {nextServiceStatus}
              </Text>
            )}
          </View>

          <ChevronRight
            size={20}
            color={COLORS.muted}
          />
        </Pressable>

        {/* RECENT SERVICES */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
                {t('home.recentServices')}
              </Text>

          <Pressable
            onPress={() =>
              router.push('/(tabs)/services')
            }
          >
            <Text style={styles.sectionLink}>
                {t('home.seeAll')}
              </Text>
          </Pressable>
        </View>

        {recentServices.map((service) => (
          <Pressable
            key={service.id}
            style={styles.serviceCard}
            onPress={() =>
              router.push({
                pathname: '/service/[id]',
                params: {
                  id: service.id,
                },
              })
            }
          >
            <View style={styles.serviceIcon}>
              <Wrench
                size={20}
                color={COLORS.blue}
              />
            </View>

            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>
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
              size={18}
              color={COLORS.muted}
            />
          </Pressable>
        ))}

        {recentServices.length === 0 && (
          <View style={styles.emptyServices}>
            <FileText
              size={24}
              color={COLORS.muted}
            />

            <Text style={styles.emptyText}>
              {isLoadingServices
                ? t('home.loadingServices')
                : isServicesError
                  ? t('home.servicesUnavailable')
                  : t('home.noServices')}
            </Text>

            {isServicesError && (
              <Pressable
                onPress={() =>
                  void refetchServices()
                }
              >
                <Text style={styles.sectionLink}>
                {t('common.retry')}
              </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ADD SERVICE */}

        <Pressable
          style={styles.addServiceButton}
          onPress={handleAddService}
        >
          <Plus
            size={21}
            color={COLORS.navy}
          />

          <Text style={styles.addServiceText}>
                {t('services.addService')}
              </Text>
        </Pressable>
      </Animated.ScrollView>

      {/* FIXED ANIMATED HEADER */}

      <Animated.View
        style={[
          styles.animatedHeader,
          {
            height: totalHeaderHeight,
            paddingTop: topInset,
            backgroundColor: headerBackgroundColor,
          },
        ]}
      >
        <Text
          style={styles.headerTitle}
          numberOfLines={1}
        >
          LovableCar
        </Text>

        <Pressable
          onPress={openProfile}
          style={styles.headerAction}
          accessibilityRole="button"
          accessibilityLabel={t('home.openProfile')}
        >
          {showAvatar ? (
            <Image
              source={{ uri: photoUrl! }}
              style={styles.profileAvatar}
              onError={() => {
                setAvatarError(true);
              }}
            />
          ) : (
            <View style={styles.profileAvatarFallback}>
              <Text style={styles.profileInitials}>
                {initials}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* PROFILE POPUP */}

      <Modal
        visible={profileVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeProfile}
      >
        <Pressable
          style={[
            styles.modalOverlay,
            {
              paddingTop:
                topInset + HEADER_HEIGHT + 8,
            },
          ]}
          onPress={closeProfile}
        >
          <Pressable
            style={styles.profilePopup}
            onPress={(event) =>
              event.stopPropagation()
            }
          >
            {/* PROFILE HEADER */}

            <View style={styles.popupHeader}>
              <View style={styles.popupUserRow}>
                {showAvatar ? (
                  <Image
                    source={{ uri: photoUrl! }}
                    style={styles.popupAvatar}
                    onError={() => {
                      setAvatarError(true);
                    }}
                  />
                ) : (
                  <View
                    style={styles.popupAvatarFallback}
                  >
                    <Text style={styles.popupInitials}>
                      {initials}
                    </Text>
                  </View>
                )}

                <View style={styles.popupUserInfo}>
                  <Text
                    style={styles.popupUserName}
                    numberOfLines={1}
                  >
                    {displayName}
                  </Text>

                  {user?.username && (
                    <Text
                      style={styles.popupUsername}
                      numberOfLines={1}
                    >
                      @{user.username}
                    </Text>
                  )}
                </View>

                <Pressable
                  onPress={closeProfile}
                  style={styles.popupCloseButton}
                >
                  <X
                    size={20}
                    color={COLORS.muted}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.popupDivider} />

            {/* MY PROFILE */}

            <Pressable
              style={styles.popupItem}
              onPress={openMore}
            >
              <UserRound
                size={20}
                color={COLORS.navy}
              />

              <Text style={styles.popupItemText}>
                {t('profile.title')}
              </Text>

              <ChevronRight
                size={18}
                color={COLORS.muted}
              />
            </Pressable>

            {/* TELEGRAM NOTIFICATIONS */}

            <Pressable
              style={styles.popupItem}
              onPress={openTelegramSettings}
            >
              <Bell
                size={20}
                color={COLORS.navy}
              />

              <Text style={styles.popupItemText}>
                {t('more.telegramNotifications')}
              </Text>

              <ChevronRight
                size={18}
                color={COLORS.muted}
              />
            </Pressable>

            <View style={styles.popupDivider} />

            {/* LOGOUT */}

            <Pressable
              style={styles.popupItem}
              onPress={() =>
                void handleLogout()
              }
            >
              <LogOut
                size={20}
                color={COLORS.red}
              />

              <Text
                style={[
                  styles.popupItemText,
                  {
                    color: COLORS.red,
                  },
                ]}
              >
                {t('profile.logout')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ImageBackground>
  );
}

// -----------------------------------
// STYLES
// -----------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.sky,
    width: '100%',
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  // -----------------------------------
  // ANIMATED HEADER
  // -----------------------------------

  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
    elevation: 10,
  },

  headerTitle: {
    flexShrink: 1,
    color: COLORS.navy,
    fontSize: 24,
    fontWeight: '800',
  },

  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // -----------------------------------
  // PROFILE AVATAR
  // -----------------------------------

  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  profileAvatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileInitials: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },

  // -----------------------------------
  // PROFILE MODAL
  // -----------------------------------

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9,39,71,0.25)',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
  },

  profilePopup: {
    width: 300,
    maxWidth: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 12,
    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  popupHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  popupUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  popupUserInfo: {
    flex: 1,
  },

  popupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  popupAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  popupInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },

  popupUserName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },

  popupUsername: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.muted,
  },

  popupCloseButton: {
    padding: 4,
  },

  popupDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },

  popupItem: {
    minHeight: 48,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  popupItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
  },

  // -----------------------------------
  // VEHICLE CARD
  // -----------------------------------

  vehicleCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },

  vehicleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },

  vehicleBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },

  vehicleDetails: {
    flex: 1,
  },

  vehicleName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },

  vehicleSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
  },

  vehicleIllustration: {
    width: '100%',
    height: 160,
  },

  vehicleCardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  vehicleFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  vehicleFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  vehicleFooterText: {
    fontSize: 12,
    color: COLORS.green,
  },

  vehicleFooterLink: {
    fontSize: 12,
    color: COLORS.blue,
    fontWeight: '700',
  },


  errorCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },

  errorText: {
    color: '#B91C1C',
    fontSize: 13,
  },


  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },

  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    minHeight: 110,
  },

  statIconBlue: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statIconYellow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1BE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statValue: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.navy,
    marginTop: 8,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },

  statUnit: {
    fontSize: 10,
    color: COLORS.muted,
  },


  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },

  sectionLink: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
  },


  maintenanceCard: {
    backgroundColor: '#FFF6DC',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#FFE4A2',
  },

  maintenanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  maintenanceInfo: {
    flex: 1,
  },

  maintenanceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },

  maintenanceSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 5,
  },

  maintenanceStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.amber,
    marginTop: 6,
  },


  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },

  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  serviceInfo: {
    flex: 1,
  },

  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },

  serviceSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 5,
  },

  emptyServices: {
    padding: 24,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
  },


  addServiceButton: {
    marginTop: 20,
    height: 54,
    backgroundColor: COLORS.yellow,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  addServiceText: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '800',
  },
});
