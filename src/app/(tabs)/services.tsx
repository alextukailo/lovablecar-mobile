
import { useQueries } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
    CalendarDays,
    CarFront,
    Check,
    ChevronDown,
    ChevronRight,
    CircleDollarSign,
    Gauge,
    Plus,
    Search,
    SlidersHorizontal,
    Wrench,
    X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    ImageBackground,
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

const C = {
  navy: '#092344',
  blue: '#0872D5',
  muted: '#58799D',
  sky: '#DDF1FF',
  yellow: '#FFD43B',
  yellowLight: '#FFF6D9',
  white: '#FFFFFF',
  border: '#E1EDF7',
  danger: '#D85A52',
};

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

function formatDate(value: string) {
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

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return '—';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function getServiceIcon(title: string) {
  const text = title.toLowerCase();

  if (
    text.includes('масл') ||
    text.includes('oil')
  ) {
    return 'oil';
  }

  if (
    text.includes('свеч') ||
    text.includes('spark')
  ) {
    return 'spark';
  }

  if (
    text.includes('тормоз') ||
    text.includes('brake')
  ) {
    return 'brake';
  }

  return 'service';
}

export default function ServicesScreen() {
  const [filtersExpanded, setFiltersExpanded] =
    useState(false);

  const {
    data: cars = [],
    isLoading: isLoadingCars,
    isError: isCarsError,
    refetch: refetchCars,
  } = useCars();

  const selectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

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

  const selectedServices = allServices.filter(
    (service) => service.carId === selectedCar?.id,
  );

  const visibleServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = selectedServices.filter(
      (service) => {
        if (!query) return true;

        return [
          service.title,
          service.workshop ?? '',
          service.carName,
          String(service.mileage),
          service.currency ?? '',
        ].some((value) =>
          value.toLowerCase().includes(query),
        );
      },
    );

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

        default:
          return (
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
          );
      }
    });
  }, [selectedServices, searchQuery, sortOrder]);

  const totalsByCurrency = selectedServices.reduce<
    Record<string, number>
  >((totals, service) => {
    if (
      service.cost === null ||
      service.cost === undefined
    ) {
      return totals;
    }

    const value = Number(service.cost);

    if (!Number.isFinite(value)) return totals;

    const currency = service.currency || 'BYN';

    totals[currency] =
      (totals[currency] ?? 0) + value;

    return totals;
  }, {});

  const totalEntries = Object.entries(totalsByCurrency);

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
          color={C.blue}
        />
        <Text style={styles.statusText}>
          Loading your cars...
        </Text>
      </View>
    );
  }

  if (isCarsError) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>
          Unable to load cars
        </Text>
        <Pressable
          style={styles.yellowButton}
          onPress={retry}
        >
          <Text style={styles.yellowButtonText}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={require('../../../assets/images/lovablecar-main-background.png')}
        resizeMode="cover"
        style={styles.background}
        blurRadius={10}
      >
        <FlatList
          data={
            isLoadingServices || isServicesError
              ? []
              : visibleServices
          }
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              {/* PAGE TITLE */}
              <View style={styles.heading}>
                <Text style={styles.pageTitle}>
                  Service History
                </Text>

                <Text style={styles.pageSubtitle}>
                  Keep your car in perfect condition
                </Text>
              </View>

              {/* CAR SELECTOR */}
              {selectedCar && (
                <View style={styles.vehicleCard}>
                  <View style={styles.vehicleIcon}>
                    <CarFront
                      size={29}
                      color={C.navy}
                      strokeWidth={1.8}
                    />
                  </View>

                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>
                      {selectedCar.make}{' '}
                      {selectedCar.model}
                    </Text>

                    <Text style={styles.vehicleDetails}>
                      {selectedCar.year}
                      {selectedCar.engine
                        ? ` · ${selectedCar.engine}`
                        : ''}
                    </Text>
                  </View>

                  <View style={styles.vehicleMileage}>
                    <Gauge
                      size={16}
                      color={C.blue}
                    />
                    <Text style={styles.vehicleMileageText}>
                      {formatNumber(selectedCar.mileage)}
                    </Text>
                  </View>
                </View>
              )}

              {/* MULTIPLE CARS */}
              {cars.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carSelector}
                >
                  {cars.map((car) => (
                    <Pressable
                      key={car.id}
                      onPress={() => selectCar(car.id)}
                      style={[
                        styles.carChip,
                        selectedCar?.id === car.id &&
                          styles.carChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.carChipText,
                          selectedCar?.id === car.id &&
                            styles.carChipTextActive,
                        ]}
                      >
                        {car.make} {car.model}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {/* SUMMARY */}
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryIconBlue}>
                    <Wrench
                      size={20}
                      color={C.blue}
                    />
                  </View>

                  <Text style={styles.summaryNumber}>
                    {selectedServices.length}
                  </Text>

                  <Text style={styles.summaryLabel}>
                    Total services
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <View style={styles.summaryIconYellow}>
                    <CircleDollarSign
                      size={21}
                      color={C.navy}
                    />
                  </View>

                  {showCosts ? (
                    <>
                      <Text
                        style={styles.summaryNumber}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {totalEntries.length === 1
                          ? formatMoney(totalEntries[0][1])
                          : totalEntries.length === 0
                            ? '0'
                            : 'Multiple'}
                      </Text>

                      <Text style={styles.summaryLabel}>
                        {totalEntries.length === 1
                          ? `Total · ${totalEntries[0][0]}`
                          : 'Total spending'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.summaryNumber}>
                        ••••
                      </Text>
                      <Text style={styles.summaryLabel}>
                        Costs hidden
                      </Text>
                    </>
                  )}
                </View>
              </View>

              {/* SEARCH */}
              <View style={styles.searchContainer}>
                <Search
                  size={20}
                  color="#6E91B5"
                />

                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search services or workshops..."
                  placeholderTextColor="#8BA3BC"
                  style={styles.searchInput}
                  autoCorrect={false}
                  returnKeyType="search"
                />

                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    hitSlop={10}
                  >
                    <X
                      size={18}
                      color="#8BA3BC"
                    />
                  </Pressable>
                )}
              </View>

              {/* FILTER HEADER */}
              <View style={styles.filterHeader}>
                <Pressable
                  style={styles.filterToggle}
                  onPress={() =>
                    setFiltersExpanded(!filtersExpanded)
                  }
                >
                  <SlidersHorizontal
                    size={18}
                    color={C.navy}
                  />
                  <Text style={styles.filterToggleText}>
                    Sort & Filters
                  </Text>
                  <ChevronDown
                    size={16}
                    color={C.navy}
                    style={{
                      transform: [
                        {
                          rotate: filtersExpanded
                            ? '180deg'
                            : '0deg',
                        },
                      ],
                    }}
                  />
                </Pressable>

                <Text style={styles.resultCount}>
                  {visibleServices.length} records
                </Text>
              </View>

              {/* FILTER OPTIONS */}
              {filtersExpanded && (
                <View style={styles.filtersPanel}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sortRow}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() =>
                          setSortOrder(option.value)
                        }
                        style={[
                          styles.sortChip,
                          sortOrder === option.value &&
                            styles.sortChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.sortChipText,
                            sortOrder === option.value &&
                              styles.sortChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  <View style={styles.filterBottom}>
                    <Pressable
                      style={styles.checkboxRow}
                      onPress={() =>
                        setShowCosts(!showCosts)
                      }
                    >
                      <View
                        style={[
                          styles.checkbox,
                          showCosts &&
                            styles.checkboxActive,
                        ]}
                      >
                        {showCosts && (
                          <Check
                            size={13}
                            color={C.navy}
                            strokeWidth={3}
                          />
                        )}
                      </View>

                      <Text style={styles.checkboxLabel}>
                        Show costs
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={resetFilters}
                    >
                      <Text style={styles.resetText}>
                        Reset filters
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* LIST HEADING */}
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>
                  Recent Services
                </Text>

                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>
                    {visibleServices.length}
                  </Text>
                </View>
              </View>

              {isLoadingServices && (
                <View style={styles.statusCard}>
                  <ActivityIndicator
                    color={C.blue}
                  />
                  <Text style={styles.statusText}>
                    Loading services...
                  </Text>
                </View>
              )}

              {isServicesError && (
                <View style={styles.statusCard}>
                  <Text style={styles.emptyTitle}>
                    Could not load services
                  </Text>
                  <Text style={styles.emptyText}>
                    Please check your connection.
                  </Text>
                  <Pressable
                    style={styles.yellowButton}
                    onPress={retry}
                  >
                    <Text style={styles.yellowButtonText}>
                      Try again
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          }
          renderItem={({ item }) => (
            <ServiceCard
              service={item}
              showCosts={showCosts}
              onPress={() => openService(item)}
            />
          )}
          ListEmptyComponent={
            !isLoadingServices && !isServicesError ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Wrench
                    size={32}
                    color={C.blue}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  {searchQuery.trim()
                    ? 'No matching services'
                    : 'No services yet'}
                </Text>

                <Text style={styles.emptyText}>
                  {searchQuery.trim()
                    ? 'Try another search or reset your filters.'
                    : 'Add your first service to start tracking your car maintenance.'}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            <View style={styles.footerSpace} />
          }
        />

        {/* FIXED ADD BUTTON */}
        <View style={styles.bottomBar}>
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
              Add Service
            </Text>
          </Pressable>
        </View>
      </ImageBackground>
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
  const type = getServiceIcon(service.title);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.serviceCard,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.serviceTop}>
        <View
          style={[
            styles.serviceIcon,
            type === 'oil' &&
              styles.serviceIconYellow,
          ]}
        >
          <Wrench
            size={22}
            color={
              type === 'oil'
                ? C.navy
                : C.blue
            }
            strokeWidth={2}
          />
        </View>

        <View style={styles.serviceMain}>
          <Text style={styles.serviceTitle}>
            {service.title}
          </Text>

          <View style={styles.serviceMeta}>
            <CalendarDays
              size={13}
              color={C.muted}
            />
            <Text style={styles.serviceMetaText}>
              {formatDate(service.date)}
            </Text>
          </View>
        </View>

        <ChevronRight
          size={20}
          color="#86A3BF"
        />
      </View>

      <View style={styles.serviceDivider} />

      <View style={styles.serviceBottom}>
        <View style={styles.serviceBottomLeft}>
          <View style={styles.metaPill}>
            <Gauge
              size={15}
              color={C.blue}
            />

            <Text style={styles.metaPillText}>
              {formatNumber(service.mileage)} km
            </Text>
          </View>

          {service.workshop ? (
            <Text
              style={styles.workshopText}
              numberOfLines={1}
            >
              {service.workshop}
            </Text>
          ) : null}
        </View>

        {showCosts && (
          <View style={styles.costContainer}>
            <Text style={styles.costValue}>
              {formatMoney(service.cost)}
            </Text>
            <Text style={styles.costCurrency}>
              {service.currency || ''}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.sky,
  },

  background: {
    flex: 1,
    width: '100%',
  },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 20,
  },

  heading: {
    marginBottom: 22,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: C.navy,
    letterSpacing: -0.8,
  },

  pageSubtitle: {
    fontSize: 14,
    color: '#41658E',
    marginTop: 5,
  },

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFFF2',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    gap: 12,
    shadowColor: '#2D70A4',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFDC60',
    justifyContent: 'center',
    alignItems: 'center',
  },

  vehicleInfo: {
    flex: 1,
  },

  vehicleName: {
    fontSize: 16,
    fontWeight: '800',
    color: C.navy,
  },

  vehicleDetails: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
  },

  vehicleMileage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  vehicleMileageText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.navy,
  },

  carSelector: {
    gap: 8,
    paddingBottom: 14,
  },

  carChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFFE8',
    borderWidth: 1,
    borderColor: C.border,
  },

  carChipActive: {
    backgroundColor: C.yellow,
    borderColor: '#EAB800',
  },

  carChipText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  carChipTextActive: {
    color: C.navy,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFFF0',
    borderRadius: 20,
    padding: 16,
    minHeight: 135,
    justifyContent: 'center',
  },

  summaryIconBlue: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#E3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  summaryIconYellow: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: '#FFF1B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  summaryNumber: {
    fontSize: 23,
    fontWeight: '900',
    color: C.navy,
    letterSpacing: -0.5,
  },

  summaryLabel: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
  },

  searchContainer: {
    height: 52,
    backgroundColor: '#FFFFFFF5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    height: '100%',
    color: C.navy,
    fontSize: 14,
    outlineStyle: 'none',
  } as any,

  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },

  filterToggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.navy,
  },

  resultCount: {
    fontSize: 12,
    color: C.muted,
  },

  filtersPanel: {
    backgroundColor: '#FFFFFFE8',
    borderRadius: 18,
    paddingVertical: 14,
    marginBottom: 12,
  },

  sortRow: {
    paddingHorizontal: 12,
    gap: 8,
  },

  sortChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#F1F7FC',
    borderWidth: 1,
    borderColor: C.border,
  },

  sortChipActive: {
    backgroundColor: C.yellowLight,
    borderColor: C.yellow,
  },

  sortChipText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '700',
  },

  sortChipTextActive: {
    color: C.navy,
  },

  filterBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 16,
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#8CAAC5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxActive: {
    backgroundColor: C.yellow,
    borderColor: '#E4B400',
  },

  checkboxLabel: {
    color: C.navy,
    fontSize: 12,
    fontWeight: '700',
  },

  resetText: {
    color: C.blue,
    fontSize: 12,
    fontWeight: '700',
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 8,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: C.navy,
  },

  sectionBadge: {
    backgroundColor: '#D7ECFC',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },

  sectionBadgeText: {
    color: C.blue,
    fontSize: 12,
    fontWeight: '800',
  },

  serviceCard: {
    backgroundColor: '#FFFFFFF5',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2D70A4',
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 1,
  },

  cardPressed: {
    opacity: 0.85,
  },

  serviceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  serviceIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  serviceIconYellow: {
    backgroundColor: '#FFF0B8',
  },

  serviceMain: {
    flex: 1,
  },

  serviceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.navy,
    lineHeight: 21,
  },

  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },

  serviceMetaText: {
    color: C.muted,
    fontSize: 12,
  },

  serviceDivider: {
    height: 1,
    backgroundColor: '#EAF1F7',
    marginVertical: 13,
  },

  serviceBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },

  serviceBottomLeft: {
    flex: 1,
    gap: 6,
    alignItems: 'flex-start',
  },

  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF7FF',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  metaPillText: {
    fontSize: 12,
    color: C.navy,
    fontWeight: '700',
  },

  workshopText: {
    fontSize: 12,
    color: C.muted,
    maxWidth: '100%',
  },

  costContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },

  costValue: {
    fontSize: 17,
    fontWeight: '900',
    color: C.navy,
  },

  costCurrency: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
  },

  bottomBar: {
    backgroundColor: '#FFFFFFF0',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E1EDF7',
  },

  addButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: C.yellow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  addButtonText: {
    fontSize: 15,
    fontWeight: '900',
    color: C.navy,
  },

  emptyCard: {
    backgroundColor: '#FFFFFFE8',
    borderRadius: 20,
    alignItems: 'center',
    padding: 28,
    gap: 10,
  },

  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.navy,
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 20,
  },

  statusCard: {
    backgroundColor: '#FFFFFFE8',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    gap: 12,
  },

  statusText: {
    color: C.muted,
    fontSize: 13,
    marginTop: 8,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.sky,
    padding: 24,
  },

  yellowButton: {
    backgroundColor: C.yellow,
    borderRadius: 14,
    paddingHorizontal: 25,
    paddingVertical: 13,
    marginTop: 12,
  },

  yellowButtonText: {
    color: C.navy,
    fontWeight: '800',
  },

  footerSpace: {
    height: 12,
  },
});
