
import { router } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    useCarMaintenanceSchedules,
} from '../../../lib/maintenance.queries';

import { useCars } from '../../features/cars/hooks/useCars';

import MaintenanceStatusBadge from '../../features/maintenance/components/MaintenanceStatusBadge';

import {
    calculateMaintenanceOverview,
} from '../../features/maintenance/utils/maintenance-overview';

import {
    getMaintenanceUrgency,
} from '../../features/maintenance/utils/maintenance-urgency';

import {
    getMaintenanceUrgencyColors,
} from '../../features/maintenance/utils/maintenance-theme';

import { useCarStore } from '../../store/car.store';

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
      <Text style={styles.maintenanceLoading}>
        Checking maintenance...
      </Text>
    );
  }

  if (isError) {
    return (
      <Pressable
        style={styles.maintenanceErrorContainer}
        onPress={(event) => {
          event.stopPropagation();
          void refetch();
        }}
      >
        <Text style={styles.maintenanceError}>
          Could not load maintenance · Retry
        </Text>
      </Pressable>
    );
  }

  const overview = calculateMaintenanceOverview(
    schedules,
    mileage,
  );

  const urgency = getMaintenanceUrgency(overview);

  const urgencyColors = getMaintenanceUrgencyColors(
    urgency.level,
  );

  const { counts } = overview;

  return (
    <View style={styles.maintenanceSection}>
      <View style={styles.maintenanceWarnings}>
        {counts.overdue > 0 && (
          <MaintenanceStatusBadge
            status="OVERDUE"
            count={counts.overdue}
          />
        )}

        {counts.dueSoon > 0 && (
          <MaintenanceStatusBadge
            status="DUE_SOON"
            count={counts.dueSoon}
          />
        )}

        {counts.overdue === 0 &&
          counts.dueSoon === 0 &&
          counts.configured > 0 && (
            <MaintenanceStatusBadge status="OK" />
          )}

        {counts.unconfigured > 0 && (
          <MaintenanceStatusBadge
            status="NOT_CONFIGURED"
            count={counts.unconfigured}
          />
        )}
      </View>

      <Text
        style={[
          styles.maintenanceSummaryText,
          { color: urgencyColors.text },
        ]}
      >
        {urgency.label}
      </Text>
    </View>
  );
}

export default function CarsScreen() {
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

  // Use the stored selection only if that car
  // still exists in the PostgreSQL response.
  const selectedCarExists = cars.some(
    (car) => car.id === storedSelectedCarId,
  );

  const selectedCarId = selectedCarExists
    ? storedSelectedCarId
    : (
        cars.find((car) => car.isPrimary)?.id ??
        cars[0]?.id ??
        null
      );

  const handleSelectCar = (carId: string) => {
    selectCar(carId);

    router.push({
      pathname: '/car/[id]',
      params: {
        id: carId,
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              My cars
            </Text>

            <Text style={styles.subtitle}>
              Manage your vehicles
            </Text>
          </View>

          <Pressable
            style={styles.addSmallButton}
            onPress={() => {
              router.push('/car/new');
            }}
          >
            <Text style={styles.addSmallButtonText}>
              +
            </Text>
          </Pressable>
        </View>

        {isLoading && (
          <Text style={styles.statusText}>
            Loading cars...
          </Text>
        )}

        {isError && (
          <Pressable
            onPress={() => void refetch()}
          >
            <Text style={styles.errorText}>
              Could not load cars. Tap to retry.
            </Text>
          </Pressable>
        )}

        {!isLoading &&
          !isError &&
          cars.length === 0 && (
            <Text style={styles.statusText}>
              No cars yet. Add your first car.
            </Text>
          )}

        {cars.map((car) => {
          const isSelected =
            car.id === selectedCarId;

          return (
            <Pressable
              key={car.id}
              style={[
                styles.carCard,
                isSelected && styles.selectedCarCard,
              ]}
              onPress={() => handleSelectCar(car.id)}
            >
              <View style={styles.carIcon}>
                <Text style={styles.carEmoji}>
                  🚗
                </Text>
              </View>

              <View style={styles.carInfo}>
                <View style={styles.carTitleRow}>
                  <Text style={styles.carTitle}>
                    {car.make} {car.model}
                  </Text>

                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Text
                        style={styles.selectedBadgeText}
                      >
                        Selected
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.carDetails}>
                  {car.year}
                  {car.engine
                    ? ` · ${car.engine}`
                    : ''}
                </Text>

                <Text style={styles.carMileage}>
                  {car.mileage.toLocaleString()} km
                </Text>

                <MaintenanceSummary
                  carId={car.id}
                  mileage={car.mileage}
                />
              </View>
            </Pressable>
          );
        })}

        <Pressable
          style={styles.addCarButton}
          onPress={() => {
            router.push('/car/new');
          }}
        >
          <Text style={styles.addCarButtonText}>
            + Add another car
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#171717',
  },

  subtitle: {
    fontSize: 15,
    color: '#737373',
    marginTop: 5,
  },

  addSmallButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F5C400',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addSmallButtonText: {
    fontSize: 28,
    lineHeight: 30,
    color: '#171717',
  },

  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  selectedCarCard: {
    borderColor: '#F5C400',
  },

  carIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  carEmoji: {
    fontSize: 28,
  },

  carInfo: {
    flex: 1,
    marginLeft: 14,
  },

  carTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  carTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171717',
  },

  selectedBadge: {
    marginLeft: 8,
    backgroundColor: '#FFF4B8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  selectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7A5E00',
  },

  carDetails: {
    fontSize: 14,
    color: '#737373',
    marginTop: 4,
  },

  carMileage: {
    fontSize: 13,
    color: '#A3A3A3',
    marginTop: 5,
  },

  maintenanceSection: {
    marginTop: 10,
  },

  maintenanceWarnings: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  maintenanceSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },

  maintenanceLoading: {
    fontSize: 12,
    color: '#A3A3A3',
    marginTop: 10,
  },

  maintenanceErrorContainer: {
    marginTop: 10,
  },

  maintenanceError: {
    fontSize: 12,
    color: '#B91C1C',
  },

  addCarButton: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  addCarButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
  },

  statusText: {
    fontSize: 14,
    color: '#737373',
    marginBottom: 16,
  },

  errorText: {
    fontSize: 14,
    color: '#B91C1C',
    marginBottom: 16,
  },
});
