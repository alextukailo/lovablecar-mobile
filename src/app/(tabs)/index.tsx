import { router } from 'expo-router';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useCarStore } from '../../store/car.store';
import { useServiceStore } from '../../store/service.store';

export default function HomeScreen() {
  const cars = useCarStore((state) => state.cars);
  const selectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectedCar = cars.find(
    (car) => car.id === selectedCarId,
  );

  const services = useServiceStore(
    (state) => state.services,
  );

  const carServices = services.filter(
    (service) => service.vehicleId === selectedCarId,
  );

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
        <View style={styles.carCard}>
          <View style={styles.carInfo}>
            <Text style={styles.carTitle}>
              🚗{' '}
              {selectedCar
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
          </View>

          {selectedCar && (
            <Text style={styles.mileage}>
              {selectedCar.mileage.toLocaleString()} km
            </Text>
          )}
        </View>

        {/* Next service */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            NEXT SERVICE
          </Text>
        </View>

        <View style={styles.nextServiceCard}>
          <View style={styles.serviceIcon}>
            <View style={styles.serviceDot} />
          </View>

          <View style={styles.nextServiceContent}>
            <Text style={styles.nextServiceTitle}>
              Engine oil
            </Text>

            <Text style={styles.nextServiceDistance}>
              1 550 km remaining
            </Text>

            <Text style={styles.nextServiceTime}>
              ~ 2 months
            </Text>
          </View>
        </View>

        {/* Add service */}
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/service/new')}
        >
          <Text style={styles.addButtonText}>
            + Add service
          </Text>
        </Pressable>

        {/* Recent services */}
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>
            RECENT
          </Text>

          {carServices.length > 0 && (
            <Pressable
              onPress={() =>
                router.push('/(tabs)/services')
              }
            >
              <Text style={styles.viewAll}>
                View all
              </Text>
            </Pressable>
          )}
        </View>

        {carServices.length === 0 ? (
          <EmptyRecent />
        ) : (
          <View>
            {carServices
              .slice(0, 3)
              .map((service) => (
                <RecentService
                  key={service.id}
                  date={service.date}
                  name={service.serviceName}
                  cost={`${service.totalCost} ${service.currency}`}
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
}: {
  date: string;
  name: string;
  cost: string;
}) {
  return (
    <View style={styles.recentItem}>
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

      <Text style={styles.recentCost}>
        {cost}
      </Text>
    </View>
  );
}

function EmptyRecent() {
  return (
    <View style={styles.emptyRecent}>
      <Text style={styles.emptyRecentIcon}>
        🔧
      </Text>

      <View style={styles.emptyRecentContent}>
        <Text style={styles.emptyRecentTitle}>
          No service records yet
        </Text>

        <Text style={styles.emptyRecentText}>
          Add your first service to start tracking
          your car.
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

  nextServiceTime: {
    fontSize: 13,
    color: '#A3A3A3',
    marginTop: 2,
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
});
