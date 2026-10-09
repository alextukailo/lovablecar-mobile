import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useCarStore } from '../../store/car.store';
import { useServiceStore } from '../../store/service.store';

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

export default function ServiceDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const service = useServiceStore((state) =>
    state.services.find((item) => item.id === id),
  );
  const removeService = useServiceStore(
    (state) => state.removeService,
  );
  const car = useCarStore((state) =>
    state.cars.find(
      (item) => item.id === service?.vehicleId,
    ),
  );

  const handleDelete = () => {
    if (!service) return;

    Alert.alert(
      'Delete service record?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeService(service.id);
            router.replace('/(tabs)/services');
          },
        },
      ],
    );
  };

  if (!service) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Service details' }} />
        <Text style={styles.title}>Service not found</Text>
        <Text style={styles.muted}>
          This record may have been deleted.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)/services')}
        >
          <Text style={styles.primaryButtonText}>
            Back to service history
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Service details' }} />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.eyebrow}>MAINTENANCE RECORD</Text>
          <Text style={styles.title}>{service.serviceName}</Text>
          <Text style={styles.muted}>
            {formatDate(service.date)}
          </Text>

          <View style={styles.costBlock}>
            <Text style={styles.costLabel}>Total cost</Text>
            <Text style={styles.cost}>
              {service.totalCost.toLocaleString()} {service.currency}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <InfoRow
            label="Car"
            value={
              car
                ? `${car.make} ${car.model} (${car.year})`
                : 'Vehicle unavailable'
            }
          />
          <InfoRow
            label="Mileage"
            value={`${service.mileage.toLocaleString()} km`}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Service information</Text>
          <InfoRow
            label="Date"
            value={formatDate(service.date)}
          />
          <InfoRow
            label="Service"
            value={service.serviceName}
          />
          <InfoRow
            label="Workshop"
            value={service.workshop?.trim() || 'Not specified'}
          />
          <InfoRow
            label="Document"
            value={
              service.documentUri
                ? 'Document attached'
                : 'No document attached'
            }
          />
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: '/service/edit',
              params: { id: service.id },
            })
          }
        >
          <Text style={styles.primaryButtonText}>
            Edit service
          </Text>
        </Pressable>

        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>
            Delete service
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: '#F5F6F8',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#737B87',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#17202A',
  },
  muted: {
    fontSize: 14,
    color: '#737B87',
  },
  costBlock: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#DDE1E6',
    gap: 4,
  },
  costLabel: {
    color: '#737B87',
    fontSize: 13,
  },
  cost: {
    fontSize: 26,
    fontWeight: '700',
    color: '#208AEF',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#17202A',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EAED',
  },
  infoLabel: {
    flex: 1,
    color: '#737B87',
    fontSize: 14,
  },
  infoValue: {
    flex: 1.5,
    color: '#17202A',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  primaryButton: {
    backgroundColor: '#208AEF',
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  deleteButton: {
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D92D20',
  },
  deleteButtonText: {
    color: '#D92D20',
    fontWeight: '600',
    fontSize: 15,
  },
});
