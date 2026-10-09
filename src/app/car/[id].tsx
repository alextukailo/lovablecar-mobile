import { router, useLocalSearchParams } from 'expo-router';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { deleteCarAndServices } from '../../features/cars/actions/deleteCar';
import { useCarStore } from '../../store/car.store';
import { useServiceStore } from '../../store/service.store';

export default function CarDetailsScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const car = useCarStore((state) =>
    state.cars.find((item) => item.id === id),
  );

  const allServices = useServiceStore((state) => state.services);

  const services = allServices
    .filter((service) => service.vehicleId === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (!car) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Car not found</Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const totalSpent = services.reduce(
    (sum, service) => sum + service.totalCost,
    0,
  );

  const latestService = services[0];

  const handleDelete = () => {
    Alert.alert(
      'Delete car?',
      `Are you sure you want to delete your ${car.make} ${car.model}? Its service history will also be deleted. This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCarAndServices(car.id);
            router.replace('/(tabs)/cars');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>
            {car.make} {car.model}
          </Text>

          <Text style={styles.subtitle}>
            {car.year}
            {car.engine ? ` · ${car.engine}` : ''}
          </Text>
        </View>

        {car.isPrimary && (
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryBadgeText}>Primary</Text>
          </View>
        )}
      </View>

      {/* Mileage */}
      <View style={styles.mileageCard}>
        <Text style={styles.mileageLabel}>CURRENT MILEAGE</Text>

        <Text style={styles.mileageValue}>
          {car.mileage.toLocaleString()} km
        </Text>
      </View>

      {/* Vehicle information */}
      <Text style={styles.sectionTitle}>VEHICLE</Text>

      <View style={styles.infoCard}>
        <InfoRow label="Make" value={car.make} />
        <InfoRow label="Model" value={car.model} />
        <InfoRow label="Year" value={String(car.year)} />
        <InfoRow label="Engine" value={car.engine || '—'} />
        <InfoRow label="VIN" value={car.vin || '—'} />
        <InfoRow
          label="License plate"
          value={car.licensePlate || '—'}
          last
        />
      </View>

      {/* Statistics */}
      <Text style={styles.sectionTitle}>SERVICE STATISTICS</Text>

      <View style={styles.statsRow}>
        <StatCard value={String(services.length)} label="Services" />

        <StatCard
          value={`${totalSpent.toLocaleString()} ${services[0]?.currency ?? 'BYN'}`}
          label="Total spent*"
        />
      </View>

      {services.length > 0 &&
        new Set(services.map((service) => service.currency)).size > 1 && (
          <Text style={styles.statsNote}>
            *Costs are displayed as recorded; multiple currencies are not
            converted.
          </Text>
        )}

      {latestService && (
        <View style={styles.lastServiceCard}>
          <Text style={styles.lastServiceLabel}>LAST SERVICE</Text>

          <Text style={styles.lastServiceName}>
            {latestService.serviceName}
          </Text>

          <Text style={styles.lastServiceDetails}>
            {formatShortDate(latestService.date)}
            {' · '}
            {latestService.mileage.toLocaleString()} km
          </Text>
        </View>
      )}

      {/* Service history */}
      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>SERVICE HISTORY</Text>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/service/new',
              params: { vehicleId: car.id },
            })
          }
        >
          <Text style={styles.addServiceText}>+ Add</Text>
        </Pressable>
      </View>

      {services.length === 0 ? (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyHistoryIcon}>🔧</Text>

          <Text style={styles.emptyHistoryTitle}>
            No service records
          </Text>

          <Text style={styles.emptyHistoryText}>
            Add your first service record for this car.
          </Text>
        </View>
      ) : (
        services.map((service) => (
          <Pressable
            key={service.id}
            style={styles.serviceItem}
            onPress={() =>
              router.push({
                pathname: '/service/[id]',
                params: { id: service.id },
              })
            }
          >
            <View style={styles.serviceDate}>
              <Text style={styles.serviceDateText}>
                {formatShortDate(service.date)}
              </Text>
            </View>

            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>
                {service.serviceName}
              </Text>

              <Text style={styles.serviceMileage}>
                {service.mileage.toLocaleString()} km
                {service.workshop ? ` · ${service.workshop}` : ''}
              </Text>
            </View>

            <Text style={styles.serviceCost}>
              {service.totalCost.toLocaleString()} {service.currency}
            </Text>
          </Pressable>
        ))
      )}

      {/* Actions */}
      <Pressable
        style={styles.editButton}
        onPress={() =>
          router.push({
            pathname: '/car/edit',
            params: { id: car.id },
          })
        }
      >
        <Text style={styles.editButtonText}>Edit car</Text>
      </Pressable>

      <Pressable
        style={styles.deleteButton}
        onPress={handleDelete}
      >
        <Text style={styles.deleteButtonText}>Delete car</Text>
      </Pressable>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },

  content: {
    padding: 20,
    paddingTop: 24,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  headerInfo: {
    flex: 1,
    paddingRight: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#171717',
  },

  subtitle: {
    fontSize: 15,
    color: '#737373',
    marginTop: 5,
  },

  primaryBadge: {
    backgroundColor: '#FFF4B8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A6D00',
  },

  mileageCard: {
    backgroundColor: '#171717',
    borderRadius: 20,
    padding: 22,
    marginTop: 24,
  },

  mileageLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#A3A3A3',
  },

  mileageValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#737373',
    marginTop: 28,
    marginBottom: 10,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
  },

  infoRow: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  infoRowLast: {
    borderBottomWidth: 0,
  },

  infoLabel: {
    fontSize: 14,
    color: '#737373',
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
    maxWidth: '60%',
    textAlign: 'right',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },

  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171717',
  },

  statLabel: {
    fontSize: 13,
    color: '#737373',
    marginTop: 4,
  },

  statsNote: {
    fontSize: 12,
    color: '#737373',
    marginTop: 8,
  },

  lastServiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginTop: 10,
  },

  lastServiceLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#A3A3A3',
  },

  lastServiceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171717',
    marginTop: 8,
  },

  lastServiceDetails: {
    fontSize: 13,
    color: '#737373',
    marginTop: 4,
  },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  addServiceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
  },

  serviceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minHeight: 72,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  serviceDate: {
    width: 70,
  },

  serviceDateText: {
    fontSize: 12,
    color: '#737373',
  },

  serviceInfo: {
    flex: 1,
    paddingHorizontal: 8,
  },

  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
  },

  serviceMileage: {
    fontSize: 12,
    color: '#737373',
    marginTop: 4,
  },

  serviceCost: {
    fontSize: 13,
    fontWeight: '600',
    color: '#171717',
  },

  emptyHistory: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },

  emptyHistoryIcon: {
    fontSize: 30,
  },

  emptyHistoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
    marginTop: 8,
  },

  emptyHistoryText: {
    fontSize: 13,
    color: '#737373',
    textAlign: 'center',
    marginTop: 4,
  },

  editButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#F5C400',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  editButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
  },

  deleteButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171717',
  },

  backButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F5C400',
  },

  backButtonText: {
    fontWeight: '700',
    color: '#171717',
  },

  bottomSpace: {
    height: 30,
  },
});
