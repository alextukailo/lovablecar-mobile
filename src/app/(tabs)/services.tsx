import { useCarStore } from '@/store/car.store';
import { useServiceStore } from '@/store/service.store';
import {
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function ServicesScreen() {

const selectedCarId = useCarStore(
  (state) => state.selectedCarId,
);

const services = useServiceStore(
  (state) => state.services,
);

const carServices = services.filter(
  (service) =>
    service.vehicleId === selectedCarId,
);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Service history</Text>

      <Text style={styles.subtitle}>
        Your car maintenance records
      </Text>

      {carServices.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔧</Text>

          <Text style={styles.emptyTitle}>
            No service records yet
          </Text>

          <Text style={styles.emptyText}>
            Scan your first service document to start
            building your car history.
          </Text>
        </View>
      ) : (
        <FlatList
          data={carServices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ServiceCard service={item} />
          )}
        />
      )}
    </View>
  );
}

function ServiceCard({
  service,
}: {
  service: {
    date: string;
    mileage: number;
    serviceName: string;
    totalCost: number;
    currency: string;
    workshop?: string;
  };
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>
            {formatDate(service.date)}
          </Text>

          <Text style={styles.mileage}>
            {service.mileage.toLocaleString()} km
          </Text>
        </View>

        <Text style={styles.price}>
          {service.totalCost} {service.currency}
        </Text>
      </View>

      <Text style={styles.serviceName}>
        {service.serviceName}
      </Text>

      {service.workshop ? (
        <Text style={styles.workshop}>
          {service.workshop}
        </Text>
      ) : null}
    </View>
  );
}

function formatDate(date: string) {
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
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#171717',
    marginTop: 20,
  },

  subtitle: {
    fontSize: 15,
    color: '#737373',
    marginTop: 6,
    marginBottom: 24,
  },

  list: {
    paddingBottom: 32,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  dateContainer: {
    flex: 1,
  },

  date: {
    fontSize: 14,
    color: '#737373',
  },

  mileage: {
    marginTop: 4,
    fontSize: 13,
    color: '#A3A3A3',
  },

  price: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },

  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginTop: 14,
  },

  workshop: {
    fontSize: 14,
    color: '#737373',
    marginTop: 5,
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },

  emptyIcon: {
    fontSize: 44,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171717',
  },

  emptyText: {
    maxWidth: 300,
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: '#737373',
  },
});
