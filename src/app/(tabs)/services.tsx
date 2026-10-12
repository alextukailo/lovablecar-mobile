
import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { api } from '../../../lib/api';
import { useCars } from '../../features/cars/hooks/useCars';
import { useCarStore } from '../../store/car.store';
import {
    useServiceStore,
    type ServiceSortOrder,
} from '../../store/service.store';

interface ApiService {
  id: string;
  date: string;
  mileage: number;
  title: string;
  cost?: string | number | null;
  currency?: string | null;
  workshop?: string | null;
}

interface ServiceListItem extends ApiService {
  carId: string;
  carName: string;
}

const SORT_OPTIONS: {
  value: ServiceSortOrder;
  label: string;
}[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'mileage-high', label: 'Mileage ↓' },
  { value: 'mileage-low', label: 'Mileage ↑' },
];

async function fetchCarServices(
  carId: string,
): Promise<ApiService[]> {
  const response = await api.get<ApiService[]>(
    `/cars/${carId}/services`,
  );

  return response.data;
}

export default function ServicesScreen() {
  const {
    data: cars = [],
    isLoading: isLoadingCars,
    isError: isCarsError,
    refetch: refetchCars,
  } = useCars();

  // Global selected-car preference.
  const selectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  // Service UI preferences.
  const searchQuery = useServiceStore(
    (state) => state.searchQuery,
  );

  const setSearchQuery = useServiceStore(
    (state) => state.setSearchQuery,
  );

  const sortOrder = useServiceStore(
    (state) => state.sortOrder,
  );

  const setSortOrder = useServiceStore(
    (state) => state.setSortOrder,
  );

  const showCosts = useServiceStore(
    (state) => state.showCosts,
  );

  const setShowCosts = useServiceStore(
    (state) => state.setShowCosts,
  );

  const resetFilters = useServiceStore(
    (state) => state.resetFilters,
  );

  const selectedCar =
    cars.find((car) => car.id === selectedCarId) ??
    cars.find((car) => car.isPrimary) ??
    cars[0] ??
    null;

  // Service records are fetched from PostgreSQL.
  const serviceQueries = useQueries({
    queries: cars.map((car) => ({
      queryKey: ['cars', car.id, 'services'],
      queryFn: () => fetchCarServices(car.id),
    })),
  });

  const isLoadingServices = serviceQueries.some(
    (query) => query.isPending,
  );

  const isServicesError = serviceQueries.some(
    (query) => query.isError,
  );

  const allServices: ServiceListItem[] =
    cars.flatMap((car, index) => {
      const records = serviceQueries[index]?.data ?? [];

      return records.map((record) => ({
        ...record,
        carId: car.id,
        carName: `${car.make} ${car.model}`,
      }));
    });

  // Filtering and sorting happen only in memory.
  // They do not modify PostgreSQL records.
  const visibleServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = allServices.filter((service) => {
      if (service.carId !== selectedCar?.id) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        service.title,
        service.workshop ?? '',
        service.carName,
        String(service.mileage),
        service.currency ?? '',
      ].some((value) =>
        value.toLowerCase().includes(query),
      );
    });

    return filtered.sort((a, b) => {
      switch (sortOrder) {
        case 'oldest':
          return (
            new Date(a.date).getTime() -
            new Date(b.date).getTime()
          );

        case 'mileage-high':
          return b.mileage - a.mileage;

        case 'mileage-low':
          return a.mileage - b.mileage;

        case 'newest':
        default:
          return (
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
          );
      }
    });
  }, [
    allServices,
    selectedCar?.id,
    searchQuery,
    sortOrder,
  ]);

  const openService = (service: ServiceListItem) => {
    selectCar(service.carId);

    router.push({
      pathname: '/service/[id]',
      params: {
        id: service.id,
        vehicleId: service.carId,
      },
    });
  };

  const addService = () => {
    if (!selectedCar) {
      router.push('/(tabs)/cars');
      return;
    }

    selectCar(selectedCar.id);

    router.push({
      pathname: '/service/new',
      params: {
        vehicleId: selectedCar.id,
      },
    });
  };

  const retry = () => {
    if (isCarsError) {
      void refetchCars();
    }

    serviceQueries.forEach((query) => {
      if (query.isError) {
        void query.refetch();
      }
    });
  };

  if (isLoadingCars) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#F5C400"
        />
        <Text style={styles.statusText}>
          Loading cars...
        </Text>
      </View>
    );
  }

  if (isCarsError) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>
          Could not load cars
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={retry}
        >
          <Text style={styles.retryText}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Service history
      </Text>

      <Text style={styles.subtitle}>
        {selectedCar
          ? `${selectedCar.make} ${selectedCar.model} maintenance records`
          : 'Your car maintenance records'}
      </Text>

      {cars.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carSelector}
        >
          {cars.map((car) => (
            <Pressable
              key={car.id}
              style={[
                styles.carChip,
                selectedCar?.id === car.id &&
                  styles.carChipSelected,
              ]}
              onPress={() => selectCar(car.id)}
            >
              <Text
                style={[
                  styles.carChipText,
                  selectedCar?.id === car.id &&
                    styles.carChipTextSelected,
                ]}
              >
                {car.make} {car.model}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search services or workshops..."
        placeholderTextColor="#A3A3A3"
        style={styles.searchInput}
        autoCorrect={false}
        returnKeyType="search"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortOptions}
      >
        {SORT_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setSortOrder(option.value)}
            style={[
              styles.sortChip,
              sortOrder === option.value &&
                styles.sortChipSelected,
            ]}
          >
            <Text
              style={[
                styles.sortChipText,
                sortOrder === option.value &&
                  styles.sortChipTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.preferencesRow}>
        <Pressable
          onPress={() => setShowCosts(!showCosts)}
        >
          <Text style={styles.preferenceText}>
            {showCosts ? '☑ Show costs' : '☐ Show costs'}
          </Text>
        </Pressable>

        <Pressable onPress={resetFilters}>
          <Text style={styles.resetText}>
            Reset filters
          </Text>
        </Pressable>
      </View>

      {isLoadingServices ? (
        <View style={styles.empty}>
          <ActivityIndicator
            size="large"
            color="#F5C400"
          />

          <Text style={styles.statusText}>
            Loading services from PostgreSQL...
          </Text>
        </View>
      ) : isServicesError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            Could not load services
          </Text>

          <Text style={styles.emptyText}>
            Please check your connection.
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={retry}
          >
            <Text style={styles.retryText}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={visibleServices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              showCosts={showCosts}
              onPress={() => openService(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyIcon}>
                🔧
              </Text>

              <Text style={styles.emptyTitle}>
                {searchQuery.trim()
                  ? 'No matching services'
                  : 'No service records yet'}
              </Text>

              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? 'Try another search or reset your filters.'
                  : 'Add a service record to start building your car history.'}
              </Text>
            </View>
          }
          ListFooterComponent={
            <Pressable
              onPress={addService}
              style={styles.addButton}
            >
              <Text style={styles.addButtonText}>
                + Add service
              </Text>
            </Pressable>
          }
        />
      )}
    </View>
  );
}

function ServiceCard({
  service,
  showCosts,
  onPress,
}: {
  service: ServiceListItem;
  showCosts: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>
            {formatDate(service.date)}
          </Text>

          <Text style={styles.mileage}>
            {service.mileage.toLocaleString()} km
          </Text>
        </View>

        {showCosts && (
          <Text style={styles.price}>
            {service.cost ?? '—'}{' '}
            {service.currency ?? ''}
          </Text>
        )}
      </View>

      <Text style={styles.serviceName}>
        {service.title}
      </Text>

      {service.workshop ? (
        <Text style={styles.workshop}>
          {service.workshop}
        </Text>
      ) : null}
    </Pressable>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-GB', {
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

  center: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
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
    marginBottom: 20,
  },

  carSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },

  carChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  carChipSelected: {
    backgroundColor: '#FFF4B8',
    borderColor: '#F5C400',
  },

  carChipText: {
    color: '#737373',
    fontSize: 13,
    fontWeight: '600',
  },

  carChipTextSelected: {
    color: '#171717',
  },

  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#171717',
    marginBottom: 14,
  },

  sortOptions: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },

  sortChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  sortChipSelected: {
    backgroundColor: '#FFF4B8',
    borderColor: '#F5C400',
  },

  sortChipText: {
    color: '#737373',
    fontSize: 12,
    fontWeight: '600',
  },

  sortChipTextSelected: {
    color: '#171717',
  },

  preferencesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  preferenceText: {
    color: '#525252',
    fontSize: 13,
    fontWeight: '600',
  },

  resetText: {
    color: '#737373',
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 13,
    color: '#A3A3A3',
    marginTop: 4,
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
  },

  emptyList: {
    alignItems: 'center',
    paddingVertical: 45,
  },

  emptyIcon: {
    fontSize: 44,
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171717',
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#737373',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },

  statusText: {
    fontSize: 14,
    color: '#737373',
    marginTop: 14,
  },

  retryButton: {
    backgroundColor: '#F5C400',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 20,
  },

  retryText: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },

  addButton: {
    backgroundColor: '#F5C400',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },

  addButtonText: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
});
