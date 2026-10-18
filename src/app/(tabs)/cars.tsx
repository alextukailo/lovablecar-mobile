
import { router } from 'expo-router';

import {
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    ArrowRight,
    CalendarClock,
    CarFront,
    Check,
    ChevronRight,
    CircleAlert,
    Gauge,
    Plus,
    ShieldCheck,
} from 'lucide-react-native';

import { useCarMaintenanceSchedules } from '../../../lib/maintenance.queries';

import { useCars } from '../../features/cars/hooks/useCars';

import { calculateMaintenanceOverview } from '../../features/maintenance/utils/maintenance-overview';

import { useCarStore } from '../../store/car.store';

// -----------------------------------
// COLORS
// -----------------------------------

const COLORS = {
  navy: '#092747',
  blue: '#1476C8',
  muted: '#5E7B99',
  sky: '#DDF2FF',
  white: '#FFFFFF',
  yellow: '#FFCC32',
  border: '#E0EDF6',
  green: '#218C83',
  red: '#D75A4C',
  amber: '#C58B16',
};

// -----------------------------------
// MAINTENANCE SUMMARY
// -----------------------------------

type MaintenanceSummaryProps = {
  carId: string;
  mileage: number;
};

function MaintenanceSummary({
  carId,
  mileage,
}: MaintenanceSummaryProps) {
  const {
    data: schedules = [],
    isLoading,
    isError,
    refetch,
  } = useCarMaintenanceSchedules(carId);

  if (isLoading) {
    return (
      <View style={styles.maintenanceRow}>
        <CalendarClock
          size={16}
          color={COLORS.muted}
        />
        <Text style={styles.maintenanceMuted}>
          Checking maintenance...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <Pressable
        style={styles.maintenanceRow}
        onPress={(event) => {
          event.stopPropagation();
          void refetch();
        }}
      >
        <CircleAlert
          size={16}
          color={COLORS.red}
        />
        <Text style={styles.maintenanceError}>
          Maintenance unavailable · Retry
        </Text>
      </Pressable>
    );
  }

  const overview = calculateMaintenanceOverview(
    schedules,
    mileage,
  );

  const { counts } = overview;

  if (counts.overdue > 0) {
    return (
      <View style={styles.maintenanceRow}>
        <CircleAlert
          size={16}
          color={COLORS.red}
        />
        <Text style={styles.maintenanceDanger}>
          {counts.overdue} overdue maintenance
          {counts.overdue === 1 ? ' item' : ' items'}
        </Text>
      </View>
    );
  }

  if (counts.dueSoon > 0) {
    return (
      <View style={styles.maintenanceRow}>
        <CalendarClock
          size={16}
          color={COLORS.amber}
        />
        <Text style={styles.maintenanceWarning}>
          {counts.dueSoon} upcoming maintenance
          {counts.dueSoon === 1 ? ' item' : ' items'}
        </Text>
      </View>
    );
  }

  if (counts.configured > 0) {
    return (
      <View style={styles.maintenanceRow}>
        <ShieldCheck
          size={16}
          color={COLORS.green}
        />
        <Text style={styles.maintenanceSuccess}>
          Maintenance up to date
        </Text>
        {counts.unconfigured > 0 && (
          <Text style={styles.maintenanceMuted}>
            · {counts.unconfigured} not configured
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.maintenanceRow}>
      <CalendarClock
        size={16}
        color={COLORS.muted}
      />
      <Text style={styles.maintenanceMuted}>
        Set up maintenance reminders
      </Text>
      <ChevronRight
        size={15}
        color={COLORS.muted}
      />
    </View>
  );
}

// -----------------------------------
// CARS SCREEN
// -----------------------------------

export default function CarsScreen() {
  const insets = useSafeAreaInsets();

  const {
    data: cars = [],
    isLoading,
    isError,
    refetch,
  } = useCars();

  const storedSelectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  const selectedCarExists = cars.some(
    (car) => car.id === storedSelectedCarId,
  );

  const selectedCarId = selectedCarExists
    ? storedSelectedCarId
    : cars.find((car) => car.isPrimary)?.id ??
      cars[0]?.id ??
      null;

  const handleSelectCar = (carId: string) => {
    selectCar(carId);

    router.push({
      pathname: '/car/[id]',
      params: {
        id: carId,
      },
    });
  };

  const handleAddCar = () => {
    router.push('/car/new');
  };

  return (
    <ImageBackground
      source={require(
        '../../../assets/images/lovablecar-main-background.png'
      )}
      style={styles.container}
      resizeMode="cover"
      blurRadius={7}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 24,
            paddingBottom: Math.max(
              insets.bottom,
              20,
            ) + 24,
          },
        ]}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>
              My cars
            </Text>

            <Text style={styles.subtitle}>
              Your garage, all in one place
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.addSmallButton,
              pressed && styles.pressedButton,
            ]}
            onPress={handleAddCar}
            accessibilityRole="button"
            accessibilityLabel="Add car"
          >
            <Plus
              size={26}
              color={COLORS.navy}
              strokeWidth={2.5}
            />
          </Pressable>
        </View>

        {/* GARAGE OVERVIEW */}

        {!isLoading && !isError && cars.length > 0 && (
          <View style={styles.garageSummary}>
            <View style={styles.garageSummaryIcon}>
              <CarFront
                size={17}
                color={COLORS.blue}
              />
            </View>

            <Text style={styles.garageSummaryText}>
              {cars.length}{' '}
              {cars.length === 1 ? 'vehicle' : 'vehicles'}{' '}
              in your garage
            </Text>

            <View style={styles.garageSummaryDot} />

            <Text style={styles.garageSummaryRight}>
              Overview
            </Text>
          </View>
        )}

        {/* LOADING */}

        {isLoading && (
          <Text style={styles.statusText}>
            Loading cars...
          </Text>
        )}

        {/* ERROR */}

        {isError && (
          <Pressable
            style={styles.errorCard}
            onPress={() => void refetch()}
          >
            <CircleAlert
              size={18}
              color={COLORS.red}
            />
            <Text style={styles.errorText}>
              Could not load cars. Tap to retry.
            </Text>
          </Pressable>
        )}

        {/* EMPTY STATE */}

        {!isLoading &&
          !isError &&
          cars.length === 0 && (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <CarFront
                  size={34}
                  color={COLORS.blue}
                />
              </View>

              <Text style={styles.emptyTitle}>
                Your garage is empty
              </Text>

              <Text style={styles.emptyDescription}>
                Add your first car to track mileage,
                services, and maintenance.
              </Text>

              <Pressable
                style={styles.emptyAddButton}
                onPress={handleAddCar}
              >
                <Plus
                  size={18}
                  color={COLORS.navy}
                />
                <Text style={styles.emptyAddText}>
                  Add your first car
                </Text>
              </Pressable>
            </View>
          )}

        {/* VEHICLE CARDS */}

        {cars.map((car) => {
          const isSelected =
            car.id === selectedCarId;

          return (
            <Pressable
              key={car.id}
              style={({ pressed }) => [
                styles.carCard,
                isSelected && styles.selectedCarCard,
                pressed && styles.pressedCard,
              ]}
              onPress={() =>
                handleSelectCar(car.id)
              }
            >
              {/* CARD HEADER */}

              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.carIconContainer,
                    isSelected &&
                      styles.carIconSelected,
                  ]}
                >
                  <CarFront
                    size={30}
                    color={COLORS.blue}
                    strokeWidth={1.8}
                  />
                </View>

                <View style={styles.cardTitleContainer}>
                  <Text
                    style={styles.carTitle}
                    numberOfLines={2}
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
                  size={22}
                  color={COLORS.muted}
                />
              </View>

              {/* SELECTED INDICATOR */}

              {isSelected && (
                <View style={styles.selectedRow}>
                  <View style={styles.selectedIndicator}>
                    <Check
                      size={13}
                      color={COLORS.green}
                      strokeWidth={3}
                    />
                    <Text style={styles.selectedText}>
                      Current vehicle
                    </Text>
                  </View>
                </View>
              )}

              {/* DIVIDER */}

              <View style={styles.cardDivider} />

              {/* MILEAGE */}

              <View style={styles.mileageSection}>
                <View style={styles.mileageIcon}>
                  <Gauge
                    size={19}
                    color={COLORS.blue}
                  />
                </View>

                <View style={styles.mileageInfo}>
                  <Text style={styles.mileageLabel}>
                    CURRENT MILEAGE
                  </Text>

                  <View style={styles.mileageValueRow}>
                    <Text style={styles.mileageValue}>
                      {car.mileage.toLocaleString()}
                    </Text>

                    <Text style={styles.mileageUnit}>
                      km
                    </Text>
                  </View>
                </View>
              </View>

              {/* MAINTENANCE STATUS */}

              <View style={styles.maintenanceContainer}>
                <MaintenanceSummary
                  carId={car.id}
                  mileage={car.mileage}
                />
              </View>

              {/* CARD FOOTER */}

              <View style={styles.cardFooter}>
                <Text style={styles.cardFooterText}>
                  Vehicle details
                </Text>

                <ArrowRight
                  size={17}
                  color={COLORS.blue}
                  strokeWidth={2.2}
                />
              </View>
            </Pressable>
          );
        })}

        {/* ADD ANOTHER CAR */}

        {cars.length > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.addCarButton,
              pressed && styles.pressedButton,
            ]}
            onPress={handleAddCar}
          >
            <View style={styles.addCarIcon}>
              <Plus
                size={19}
                color={COLORS.blue}
                strokeWidth={2.4}
              />
            </View>

            <View style={styles.addCarInfo}>
              <Text style={styles.addCarTitle}>
                Add another car
              </Text>

              <Text style={styles.addCarSubtitle}>
                Expand your garage
              </Text>
            </View>

            <ChevronRight
              size={20}
              color={COLORS.blue}
            />
          </Pressable>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

// -----------------------------------
// STYLES
// -----------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.sky,
  },

  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  content: {
    paddingHorizontal: 20,
  },

  // HEADER

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerInfo: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.7,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 5,
  },

  addSmallButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C58B16',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  pressedButton: {
    opacity: 0.75,
  },

  // GARAGE SUMMARY

  garageSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 8,
  },

  garageSummaryIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  garageSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
  },

  garageSummaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.muted,
  },

  garageSummaryRight: {
    fontSize: 12,
    color: COLORS.muted,
  },

  // VEHICLE CARD

  carCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },

  selectedCarCard: {
    borderColor: COLORS.yellow,
    borderWidth: 2,
  },

  pressedCard: {
    opacity: 0.85,
  },

  // CARD HEADER

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  carIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#EAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  carIconSelected: {
    backgroundColor: '#E4F2FF',
  },

  cardTitleContainer: {
    flex: 1,
    minWidth: 0,
  },

  carTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.3,
  },

  carSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 5,
  },

  // SELECTED

  selectedRow: {
    marginTop: 14,
    flexDirection: 'row',
  },

  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E7F6F0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  selectedText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.green,
  },

  // DIVIDER

  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },

  // MILEAGE

  mileageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  mileageIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EDF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mileageInfo: {
    flex: 1,
  },

  mileageLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.muted,
  },

  mileageValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 3,
  },

  mileageValue: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -0.6,
  },

  mileageUnit: {
    fontSize: 13,
    color: COLORS.muted,
  },

  // MAINTENANCE

  maintenanceContainer: {
    marginTop: 16,
    backgroundColor: '#F5F9FC',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },

  maintenanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },

  maintenanceMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.muted,
  },

  maintenanceDanger: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.red,
  },

  maintenanceWarning: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.amber,
  },

  maintenanceSuccess: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },

  maintenanceError: {
    fontSize: 12,
    color: COLORS.red,
  },

  // CARD FOOTER

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 7,
    marginTop: 17,
  },

  cardFooterText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.blue,
  },

  // ADD CAR

  addCarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A8C9E2',
    borderStyle: 'dashed',
    gap: 12,
    marginTop: 4,
  },

  addCarIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E6F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addCarInfo: {
    flex: 1,
  },

  addCarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },

  addCarSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },

  // EMPTY STATE

  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginTop: 20,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#EAF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.navy,
  },

  emptyDescription: {
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },

  emptyAddButton: {
    marginTop: 22,
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  emptyAddText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },

  // ERRORS AND STATUS

  statusText: {
    fontSize: 14,
    color: COLORS.muted,
    marginBottom: 16,
  },

  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },

  errorText: {
    fontSize: 13,
    color: COLORS.red,
    flex: 1,
  },
});
