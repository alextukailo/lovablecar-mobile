
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import {
    AlertCircle,
    CalendarClock,
    CarFront,
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock3,
    FileText,
    Gauge,
    Plus,
    Settings2,
    Wrench,
} from 'lucide-react-native';

import {
    Image,
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
    cars.find((car) => car.id === storedSelectedCarId) ??
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

  const maintenanceAttentionCount =
    maintenanceCounts.dueSoon +
    maintenanceCounts.overdue;

  return (
    <ImageBackground
      source={require('../../../assets/images/lovablecar-main-background.png')}
      style={styles.screen}
      resizeMode="cover"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <CarFront
                size={19}
                color={COLORS.navy}
                strokeWidth={2.4}
              />
            </View>

            <Text style={styles.brandLabel}>
              LOVABLECAR
            </Text>
          </View>

          <Text style={styles.pageTitle}>
            My Cars
          </Text>

          <Text style={styles.headerSubtitle}>
            Everything your car needs, in one place
          </Text>
        </View>

        {/* Vehicle Card */}
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
                  ? 'Loading car...'
                  : selectedCar
                    ? `${selectedCar.make} ${selectedCar.model}`
                    : 'No car selected'}
              </Text>

              <Text style={styles.vehicleSubtitle}>
                {selectedCar
                  ? `${selectedCar.year}${
                      selectedCar.engine
                        ? ` · ${selectedCar.engine}`
                        : ''
                    }`
                  : 'Tap to manage your cars'}
              </Text>
            </View>

            <ChevronRight
              size={21}
              color={COLORS.muted}
              strokeWidth={2}
            />
          </View>

          {selectedCar && (
            <Image
              source={require('../../../assets/images/lovablecar-background.png')}
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
                Vehicle overview
              </Text>
            </View>

            <View style={styles.vehicleFooterRight}>
              <Text style={styles.vehicleFooterLink}>
                View details
              </Text>
              <ChevronRight
                size={15}
                color={COLORS.blue}
              />
            </View>
          </View>
        </Pressable>

        {isCarsError && (
          <Pressable
            style={styles.errorCard}
            onPress={() => void refetchCars()}
          >
            <AlertCircle
              size={17}
              color="#B91C1C"
            />
            <Text style={styles.errorText}>
              Could not load cars. Tap to retry.
            </Text>
          </Pressable>
        )}

        {/* Statistics */}
        <View style={styles.statsRow}>
          <Pressable
            style={styles.statCard}
            onPress={openSelectedCar}
          >
            <View style={styles.statIconBlue}>
              <Gauge
                size={20}
                color={COLORS.blue}
                strokeWidth={2}
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
              Mileage
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
              <FileText
                size={20}
                color={COLORS.blue}
                strokeWidth={2}
              />
            </View>

            <Text style={styles.statValue}>
              {isLoadingServices
                ? '…'
                : isServicesError
                  ? '—'
                  : services.length}
            </Text>

            <Text style={styles.statLabel}>
              Services
            </Text>
            <Text style={styles.statUnit}>
              records
            </Text>
          </Pressable>

          <Pressable
            style={styles.statCard}
            onPress={openSelectedCar}
          >
            <View style={styles.statIconYellow}>
              <CalendarClock
                size={20}
                color="#A77900"
                strokeWidth={2}
              />
            </View>

            <Text style={styles.statValue}>
              {!selectedCar ||
              isLoadingMaintenance ||
              isMaintenanceError
                ? '—'
                : maintenanceAttentionCount}
            </Text>

            <Text style={styles.statLabel}>
              Attention
            </Text>
            <Text style={styles.statUnit}>
              items
            </Text>
          </Pressable>
        </View>

        {/* Upcoming Service */}
        <SectionHeading
          title="Upcoming Service"
          icon="calendar"
        />

        <Pressable
          style={styles.upcomingCard}
          onPress={openNextMaintenance}
        >
          <View style={styles.upcomingIcon}>
            <Wrench
              size={23}
              color={COLORS.navy}
              strokeWidth={2.2}
            />
          </View>

          <View style={styles.upcomingInfo}>
            <Text style={styles.upcomingEyebrow}>
              NEXT MAINTENANCE
            </Text>

            <Text style={styles.upcomingTitle}>
              {nextServiceTitle}
            </Text>

            <Text style={styles.upcomingDescription}>
              {nextServiceDescription}
            </Text>

            {nextServiceStatus && (
              <View style={styles.statusRow}>
                <Clock3
                  size={13}
                  color={
                    nextMaintenance?.result.status ===
                    'OVERDUE'
                      ? COLORS.red
                      : nextMaintenance?.result.status ===
                          'DUE_SOON'
                        ? COLORS.amber
                        : COLORS.green
                  }
                />

                <Text
                  style={[
                    styles.upcomingStatus,
                    nextMaintenance?.result.status ===
                    'OVERDUE'
                      ? styles.overdueText
                      : nextMaintenance?.result.status ===
                          'DUE_SOON'
                        ? styles.dueSoonText
                        : styles.upcomingText,
                  ]}
                >
                  {nextServiceStatus}
                </Text>
              </View>
            )}
          </View>

          <ChevronRight
            size={20}
            color="#9E7B24"
          />
        </Pressable>

        {/* Maintenance Overview */}
        <SectionHeading
          title="Maintenance Overview"
          icon="settings"
        />

        {!selectedCar ? (
          <MessageCard
            title="No car selected"
            description="Add or select a car to see maintenance reminders."
          />
        ) : isLoadingMaintenance ? (
          <MessageCard
            description="Loading maintenance schedules..."
          />
        ) : isMaintenanceError ? (
          <Pressable
            style={styles.errorCard}
            onPress={() => void refetchMaintenance()}
          >
            <AlertCircle
              size={17}
              color="#B91C1C"
            />
            <Text style={styles.errorText}>
              Could not load maintenance schedules. Tap to retry.
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.overviewCard}
            onPress={openSelectedCar}
          >
            <View style={styles.overviewRow}>
              <OverviewCount
                value={maintenanceCounts.overdue}
                label="Overdue"
                color={COLORS.red}
                background="#FFF0EE"
                kind="overdue"
              />

              <View style={styles.overviewDivider} />

              <OverviewCount
                value={maintenanceCounts.dueSoon}
                label="Due soon"
                color={COLORS.amber}
                background="#FFF7DF"
                kind="dueSoon"
              />

              <View style={styles.overviewDivider} />

              <OverviewCount
                value={maintenanceCounts.upcoming}
                label="Upcoming"
                color={COLORS.green}
                background="#E7F7F3"
                kind="upcoming"
              />
            </View>

            <View style={styles.overviewFooter}>
              <Text style={styles.overviewFooterText}>
                {maintenanceCounts.configured === 0
                  ? 'No maintenance due dates configured yet'
                  : 'View maintenance schedules'}
              </Text>

              <ChevronRight
                size={16}
                color={COLORS.blue}
              />
            </View>

            {maintenanceCounts.unconfigured > 0 && (
              <Text style={styles.unconfiguredText}>
                {maintenanceCounts.unconfigured}{' '}
                {maintenanceCounts.unconfigured === 1
                  ? 'enabled schedule needs configuration'
                  : 'enabled schedules need configuration'}
              </Text>
            )}
          </Pressable>
        )}

        {/* Add Service */}
        <Pressable
          style={styles.addServiceButton}
          onPress={handleAddService}
        >
          <Plus
            size={21}
            color={COLORS.navy}
            strokeWidth={2.8}
          />
          <Text style={styles.addServiceButtonText}>
            Add Service
          </Text>
        </Pressable>

        {/* Recent Services */}
        <View style={styles.recentSectionHeading}>
          <View style={styles.sectionTitleRow}>
            <ClipboardList
              size={19}
              color={COLORS.navy}
              strokeWidth={2.2}
            />
            <Text style={styles.sectionTitle}>
              Recent Services
            </Text>
          </View>

          {services.length > 0 && (
            <Pressable
              style={styles.seeAllButton}
              onPress={() =>
                router.push('/(tabs)/services')
              }
            >
              <Text style={styles.seeAll}>
                See all
              </Text>
              <ChevronRight
                size={15}
                color={COLORS.blue}
              />
            </Pressable>
          )}
        </View>

        {isLoadingServices ? (
          <MessageCard
            description="Loading recent services..."
          />
        ) : isServicesError ? (
          <Pressable
            style={styles.errorCard}
            onPress={() => void refetchServices()}
          >
            <AlertCircle
              size={17}
              color="#B91C1C"
            />
            <Text style={styles.errorText}>
              Could not load services. Tap to retry.
            </Text>
          </Pressable>
        ) : recentServices.length === 0 ? (
          <MessageCard
            title="No service records yet"
            description="Add your first service to start tracking your car."
          />
        ) : (
          <View style={styles.recentList}>
            {recentServices.map((service) => (
              <RecentService
                key={service.id}
                date={service.date}
                name={service.title}
                mileage={service.mileage}
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
    </ImageBackground>
  );
}

function SectionHeading({
  title,
  icon,
}: {
  title: string;
  icon: 'calendar' | 'settings';
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {icon === 'calendar' ? (
          <CalendarClock
            size={19}
            color={COLORS.navy}
            strokeWidth={2.2}
          />
        ) : (
          <Settings2
            size={19}
            color={COLORS.navy}
            strokeWidth={2.2}
          />
        )}

        <Text style={styles.sectionTitle}>
          {title}
        </Text>
      </View>
    </View>
  );
}

function OverviewCount({
  value,
  label,
  color,
  background,
  kind,
}: {
  value: number;
  label: string;
  color: string;
  background: string;
  kind: 'overdue' | 'dueSoon' | 'upcoming';
}) {
  return (
    <View style={styles.overviewItem}>
      <View
        style={[
          styles.overviewIcon,
          { backgroundColor: background },
        ]}
      >
        {kind === 'overdue' ? (
          <AlertCircle
            size={18}
            color={color}
            strokeWidth={2}
          />
        ) : kind === 'dueSoon' ? (
          <Clock3
            size={18}
            color={color}
            strokeWidth={2}
          />
        ) : (
          <CheckCircle2
            size={18}
            color={color}
            strokeWidth={2}
          />
        )}
      </View>

      <Text
        style={[
          styles.overviewValue,
          { color },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.overviewLabel}>
        {label}
      </Text>
    </View>
  );
}

function RecentService({
  date,
  name,
  mileage,
  cost,
  onPress,
}: {
  date: string;
  name: string;
  mileage: number;
  cost: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.recentItem}
      onPress={onPress}
    >
      <View style={styles.recentIcon}>
        <Wrench
          size={19}
          color={COLORS.blue}
          strokeWidth={2}
        />
      </View>

      <View style={styles.recentDetails}>
        <Text
          style={styles.recentName}
          numberOfLines={2}
        >
          {name}
        </Text>

        <Text style={styles.recentMeta}>
          {formatShortDate(date)}
          {' · '}
          {mileage.toLocaleString()} km
        </Text>
      </View>

      <View style={styles.recentRight}>
        <Text
          style={styles.recentCost}
          numberOfLines={1}
        >
          {cost}
        </Text>

        <ChevronRight
          size={16}
          color={COLORS.muted}
        />
      </View>
    </Pressable>
  );
}

function MessageCard({
  title,
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <View style={styles.messageCard}>
      {title && (
        <Text style={styles.messageTitle}>
          {title}
        </Text>
      )}

      <Text style={styles.messageDescription}>
        {description}
      </Text>
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
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.sky,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },

  header: {
    paddingTop: 26,
    paddingBottom: 20,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 13,
  },

  brandIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandLabel: {
    color: COLORS.navy,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: -1,
  },

  headerSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 5,
  },

  vehicleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 23,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6F0F8',
    shadowColor: '#245477',
    shadowOpacity: 0.11,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 3,
  },

  vehicleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 14,
  },

  vehicleBadge: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#E6F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  vehicleDetails: {
    flex: 1,
  },

  vehicleName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
  },

  vehicleSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },

  vehicleIllustration: {
    width: '100%',
    height: 180,
    backgroundColor: '#A6DAFC',
  },

  vehicleCardFooter: {
    paddingHorizontal: 15,
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

  vehicleFooterText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },

  vehicleFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  vehicleFooterLink: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.blue,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 15,
  },

  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 19,
    paddingVertical: 15,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIconBlue: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: '#E7F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  statIconYellow: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: '#FFF3C8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.navy,
  },

  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 5,
    textAlign: 'center',
  },

  statUnit: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },

  sectionHeader: {
    marginTop: 27,
    marginBottom: 12,
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.4,
  },

  upcomingCard: {
    backgroundColor: 'rgba(255, 247, 222, 0.97)',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#FFE09A',
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  upcomingIcon: {
    width: 51,
    height: 51,
    borderRadius: 17,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  upcomingInfo: {
    flex: 1,
  },

  upcomingEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    color: '#A67A13',
    letterSpacing: 1.2,
    marginBottom: 5,
  },

  upcomingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },

  upcomingDescription: {
    fontSize: 12,
    color: '#516D87',
    marginTop: 5,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },

  upcomingStatus: {
    fontSize: 12,
    fontWeight: '800',
  },

  overdueText: {
    color: COLORS.red,
  },

  dueSoonText: {
    color: '#A57900',
  },

  upcomingText: {
    color: COLORS.green,
  },

  overviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 21,
    padding: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  overviewItem: {
    flex: 1,
    alignItems: 'center',
  },

  overviewIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },

  overviewValue: {
    fontSize: 26,
    fontWeight: '900',
  },

  overviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 4,
  },

  overviewDivider: {
    width: 1,
    height: 45,
    backgroundColor: COLORS.border,
  },

  overviewFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 17,
    borderTopWidth: 1,
    borderTopColor: '#EDF3F8',
    paddingTop: 13,
  },

  overviewFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.blue,
    textAlign: 'center',
  },

  unconfiguredText: {
    fontSize: 12,
    color: '#A77815',
    marginTop: 9,
    textAlign: 'center',
  },

  addServiceButton: {
    marginTop: 19,
    height: 54,
    borderRadius: 17,
    backgroundColor: COLORS.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    shadowColor: '#C89112',
    shadowOpacity: 0.14,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },

  addServiceButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.navy,
  },

  recentSectionHeading: {
    marginTop: 27,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },

  seeAll: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.blue,
  },

  recentList: {
    gap: 9,
  },

  recentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 73,
  },

  recentIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  recentDetails: {
    flex: 1,
    paddingRight: 7,
  },

  recentName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
  },

  recentMeta: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 5,
  },

  recentRight: {
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: 100,
  },

  recentCost: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.navy,
  },

  messageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  messageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },

  messageDescription: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 12,
    padding: 14,
    backgroundColor: '#FFF1F1',
    borderRadius: 12,
  },

  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#B91C1C',
  },

  bottomSpace: {
    height: 28,
  },
});
