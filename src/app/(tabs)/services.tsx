
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
import { useTranslation } from 'react-i18next';
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
  key: string;
}[] = [
  {
    value: 'newest',
    key: 'newestFirst',
  },
  {
    value: 'oldest',
    key: 'oldestFirst',
  },
  {
    value: 'mileage-high',
    key: 'mileageHigh',
  },
  {
    value: 'mileage-low',
    key: 'mileageLow',
  },
];

async function fetchCarServices(
  carId: string,
): Promise<ApiService[]> {
  const response = await api.get<ApiService[]>(
    `/cars/${carId}/services`,
  );

  return response.data;
}

function formatDate(
  value: string,
  language: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    language.startsWith('ru')
      ? 'ru-RU'
      : 'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  );
}

function formatNumber(
  value: number,
  language: string,
): string {
  return value.toLocaleString(
    language.startsWith('ru')
      ? 'ru-RU'
      : 'en-US',
  );
}

function formatMoney(
  value: string | number | null | undefined,
  language: string,
): string {
  if (value === null || value === undefined) {
    return '—';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString(
    language.startsWith('ru')
      ? 'ru-RU'
      : 'en-US',
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  );
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
  const { t, i18n } = useTranslation();

  const language = i18n.language;

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
    cars.find(
      (car) => car.id === selectedCarId,
    ) ??
    cars.find((car) => car.isPrimary) ??
    cars[0] ??
    null;

  const serviceQueries = useQueries({
    queries: cars.map((car) => ({
      queryKey: [
        'cars',
        car.id,
        'services',
      ],
      queryFn: () =>
        fetchCarServices(car.id),
    })),
  });

  const isLoadingServices =
    serviceQueries.some(
      (query) => query.isPending,
    );

  const isServicesError =
    serviceQueries.some(
      (query) => query.isError,
    );

  const allServices: ServiceListItem[] =
    cars.flatMap((car, index) => {
      const records =
        serviceQueries[index]?.data ?? [];

      return records.map((record) => ({
        ...record,
        carId: car.id,
        carName:
          `${car.make} ${car.model}`,
      }));
    });

  const selectedServices = allServices.filter(
    (service) =>
      service.carId === selectedCar?.id,
  );

  const visibleServices = useMemo(() => {
    const query =
      searchQuery.trim().toLowerCase();

    const filtered = selectedServices.filter(
      (service) => {
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

        case 'newest':
        default:
          return (
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
          );
      }
    });
  }, [
    selectedServices,
    searchQuery,
    sortOrder,
  ]);

  const totalEntries = useMemo(() => {
    const totals: Record<string, number> = {};

    selectedServices.forEach((service) => {
      const cost = Number(service.cost);

      if (
        service.cost == null ||
        !Number.isFinite(cost)
      ) {
        return;
      }

      const currency =
        service.currency || 'PLN';

      totals[currency] =
        (totals[currency] || 0) + cost;
    });

    return Object.entries(totals);
  }, [selectedServices]);

  const openService = (
    service: ServiceListItem,
  ) => {
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
          {t('cars.loadingCars')}
        </Text>
      </View>
    );
  }

  if (isCarsError) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>
          {t('cars.carsUnavailable')}
        </Text>

        <Pressable
          style={styles.yellowButton}
          onPress={retry}
        >
          <Text style={styles.yellowButtonText}>
            {t('common.retry')}
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
        blurRadius={18}
      >
        <FlatList
          data={
            isLoadingServices ||
            isServicesError
              ? []
              : visibleServices
          }
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.listContent
          }
          ListHeaderComponent={
            <>
              <View style={styles.heading}>
                <Text style={styles.pageTitle}>
                  {t('services.serviceHistory')}
                </Text>

                <Text
                  style={styles.pageSubtitle}
                >
                  {t('services.heroSubtitle')}
                </Text>
              </View>

              {selectedCar && (
                <View
                  style={styles.vehicleCard}
                >
                  <View
                    style={styles.vehicleIcon}
                  >
                    <CarFront
                      size={29}
                      color={C.navy}
                      strokeWidth={1.8}
                    />
                  </View>

                  <View
                    style={styles.vehicleInfo}
                  >
                    <Text
                      style={styles.vehicleName}
                    >
                      {selectedCar.make}{' '}
                      {selectedCar.model}
                    </Text>

                    <Text
                      style={
                        styles.vehicleDetails
                      }
                    >
                      {selectedCar.year}
                      {selectedCar.engine
                        ? ` · ${selectedCar.engine}`
                        : ''}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.vehicleMileage
                    }
                  >
                    <Gauge
                      size={16}
                      color={C.blue}
                    />

                    <Text
                      style={
                        styles.vehicleMileageText
                      }
                    >
                      {formatNumber(
                        selectedCar.mileage,
                        language,
                      )}
                    </Text>
                  </View>
                </View>
              )}

              {cars.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.carSelector
                  }
                >
                  {cars.map((car) => (
                    <Pressable
                      key={car.id}
                      onPress={() =>
                        selectCar(car.id)
                      }
                      style={[
                        styles.carChip,
                        selectedCar?.id ===
                          car.id &&
                          styles.carChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.carChipText,
                          selectedCar?.id ===
                            car.id &&
                            styles.carChipTextActive,
                        ]}
                      >
                        {car.make}{' '}
                        {car.model}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              <View style={styles.summaryRow}>
                <View
                  style={styles.summaryCard}
                >
                  <View
                    style={
                      styles.summaryIconBlue
                    }
                  >
                    <Wrench
                      size={20}
                      color={C.blue}
                    />
                  </View>

                  <Text
                    style={
                      styles.summaryNumber
                    }
                  >
                    {selectedServices.length}
                  </Text>

                  <Text
                    style={
                      styles.summaryLabel
                    }
                  >
                    {t('services.totalServices')}
                  </Text>
                </View>

                <View
                  style={styles.summaryCard}
                >
                  <View
                    style={
                      styles.summaryIconYellow
                    }
                  >
                    <CircleDollarSign
                      size={21}
                      color={C.navy}
                    />
                  </View>

                  {showCosts ? (
                    <>
                      <Text
                        style={
                          styles.summaryNumber
                        }
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {totalEntries.length === 1
                          ? formatMoney(
                              totalEntries[0][1],
                              language,
                            )
                          : totalEntries.length === 0
                            ? '0'
                            : t(
                                'services.multipleCurrencies',
                              )}
                      </Text>

                      <Text
                        style={
                          styles.summaryLabel
                        }
                      >
                        {totalEntries.length === 1
                          ? `${t('services.totalSpent')} · ${totalEntries[0][0]}`
                          : t(
                              'services.totalSpent',
                            )}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text
                        style={
                          styles.summaryNumber
                        }
                      >
                        ••••
                      </Text>

                      <Text
                        style={
                          styles.summaryLabel
                        }
                      >
                        {t('services.costsHidden')}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <View
                style={styles.searchContainer}
              >
                <Search
                  size={20}
                  color="#6E91B5"
                />

                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t(
                    'services.searchPlaceholder',
                  )}
                  placeholderTextColor="#8BA3BC"
                  style={styles.searchInput}
                  autoCorrect={false}
                  returnKeyType="search"
                />

                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() =>
                      setSearchQuery('')
                    }
                    hitSlop={10}
                  >
                    <X
                      size={18}
                      color="#8BA3BC"
                    />
                  </Pressable>
                )}
              </View>

              <View
                style={styles.filterHeader}
              >
                <Pressable
                  style={styles.filterToggle}
                  onPress={() =>
                    setFiltersExpanded(
                      !filtersExpanded,
                    )
                  }
                >
                  <SlidersHorizontal
                    size={18}
                    color={C.navy}
                  />

                  <Text
                    style={
                      styles.filterToggleText
                    }
                  >
                    {t('services.sortAndFilters')}
                  </Text>

                  <ChevronDown
                    size={16}
                    color={C.navy}
                    style={{
                      transform: [
                        {
                          rotate:
                            filtersExpanded
                              ? '180deg'
                              : '0deg',
                        },
                      ],
                    }}
                  />
                </Pressable>

                <Text
                  style={styles.resultCount}
                >
                  {t('services.recordCount', {
                    count:
                      visibleServices.length,
                  })}
                </Text>
              </View>

              {filtersExpanded && (
                <View
                  style={styles.filtersPanel}
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                    }
                    contentContainerStyle={
                      styles.sortRow
                    }
                  >
                    {SORT_OPTIONS.map(
                      (option) => (
                        <Pressable
                          key={option.value}
                          onPress={() =>
                            setSortOrder(
                              option.value,
                            )
                          }
                          style={[
                            styles.sortChip,
                            sortOrder ===
                              option.value &&
                              styles.sortChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.sortChipText,
                              sortOrder ===
                                option.value &&
                                styles.sortChipTextActive,
                            ]}
                          >
                            {t(
                              `services.${option.key}`,
                            )}
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </ScrollView>

                  <View
                    style={styles.filterBottom}
                  >
                    <Pressable
                      style={
                        styles.checkboxRow
                      }
                      onPress={() =>
                        setShowCosts(
                          !showCosts,
                        )
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

                      <Text
                        style={
                          styles.checkboxLabel
                        }
                      >
                        {t('services.showCosts')}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={resetFilters}
                    >
                      <Text
                        style={styles.resetText}
                      >
                        {t(
                          'services.resetFilters',
                        )}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <View
                style={styles.sectionHeading}
              >
                <Text
                  style={styles.sectionTitle}
                >
                  {t(
                    'services.recentServices',
                  )}
                </Text>

                <View
                  style={styles.sectionBadge}
                >
                  <Text
                    style={
                      styles.sectionBadgeText
                    }
                  >
                    {visibleServices.length}
                  </Text>
                </View>
              </View>

              {isLoadingServices && (
                <View
                  style={styles.statusCard}
                >
                  <ActivityIndicator
                    color={C.blue}
                  />

                  <Text
                    style={styles.statusText}
                  >
                    {t(
                      'services.loadingServices',
                    )}
                  </Text>
                </View>
              )}

              {isServicesError && (
                <View
                  style={styles.statusCard}
                >
                  <Text
                    style={styles.emptyTitle}
                  >
                    {t(
                      'services.servicesUnavailable',
                    )}
                  </Text>

                  <Text
                    style={styles.emptyText}
                  >
                    {t(
                      'services.connectionError',
                    )}
                  </Text>

                  <Pressable
                    style={
                      styles.yellowButton
                    }
                    onPress={retry}
                  >
                    <Text
                      style={
                        styles.yellowButtonText
                      }
                    >
                      {t('common.retry')}
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
              language={language}
              onPress={() =>
                openService(item)
              }
            />
          )}
          ListEmptyComponent={
            !isLoadingServices &&
            !isServicesError ? (
              <View
                style={styles.emptyCard}
              >
                <View
                  style={
                    styles.emptyIconCircle
                  }
                >
                  <Wrench
                    size={32}
                    color={C.blue}
                  />
                </View>

                <Text
                  style={styles.emptyTitle}
                >
                  {searchQuery.trim()
                    ? t(
                        'services.noResults',
                      )
                    : t(
                        'services.noServices',
                      )}
                </Text>

                <Text
                  style={styles.emptyText}
                >
                  {searchQuery.trim()
                    ? t(
                        'services.noResultsDescription',
                      )
                    : t(
                        'services.noServicesDescription',
                      )}
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            <View
              style={styles.footerSpace}
            />
          }
        />

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

            <Text
              style={styles.addButtonText}
            >
              {t('services.addService')}
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
  language,
  onPress,
}: {
  service: ServiceListItem;
  showCosts: boolean;
  language: string;
  onPress: () => void;
}) {
  const type = getServiceIcon(
    service.title,
  );

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
          <Text
            style={styles.serviceTitle}
          >
            {service.title}
          </Text>

          <View style={styles.serviceMeta}>
            <CalendarDays
              size={13}
              color={C.muted}
            />

            <Text
              style={
                styles.serviceMetaText
              }
            >
              {formatDate(
                service.date,
                language,
              )}
            </Text>
          </View>
        </View>

        <ChevronRight
          size={20}
          color="#86A3BF"
        />
      </View>

      <View
        style={styles.serviceDivider}
      />

      <View
        style={styles.serviceBottom}
      >
        <View
          style={
            styles.serviceBottomLeft
          }
        >
          <View
            style={styles.metaPill}
          >
            <Gauge
              size={15}
              color={C.blue}
            />

            <Text
              style={
                styles.metaPillText
              }
            >
              {formatNumber(
                service.mileage,
                language,
              )}{' '}
              {language.startsWith('ru')
                ? 'км'
                : 'km'}
            </Text>
          </View>

          {service.workshop ? (
            <Text
              style={
                styles.workshopText
              }
              numberOfLines={1}
            >
              {service.workshop}
            </Text>
          ) : null}
        </View>

        {showCosts && (
          <View
            style={
              styles.serviceCostContainer
            }
          >
            <Text
              style={styles.serviceCost}
            >
              {formatMoney(
                service.cost,
                language,
              )}
            </Text>

            <Text
              style={
                styles.serviceCurrency
              }
            >
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
  center: {
    flex: 1,
    backgroundColor: C.sky,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 26,
    paddingBottom: 20,
  },
  heading: {
    marginBottom: 22,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: C.navy,
    letterSpacing: -0.8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#f00303',
    marginTop: 5,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 22,
    backgroundColor: '#FFFFFFF2',
    borderWidth: 1,
    borderColor: C.white,
    marginBottom: 15,
    shadowColor: '#2D70A4',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  vehicleIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: '#FFDC60',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 17,
    fontWeight: '800',
    color: C.navy,
  },
  vehicleDetails: {
    fontSize: 12,
    color: C.muted,
    marginTop: 5,
  },
  vehicleMileage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  vehicleMileageText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.blue,
  },
  carSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 15,
  },
  carChip: {
    backgroundColor: '#FFFFFFE8',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  carChipActive: {
    backgroundColor: C.yellowLight,
    borderColor: '#EAB800',
  },
  carChipText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: '700',
  },
  carChipTextActive: {
    color: C.navy,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 22,
    padding: 17,
    backgroundColor: '#FFFFFFF0',
    borderWidth: 1,
    borderColor: C.white,
  },
  summaryIconBlue: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#E3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryIconYellow: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFF1B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryNumber: {
    fontSize: 25,
    fontWeight: '800',
    color: C.navy,
  },
  summaryLabel: {
    fontSize: 12,
    color: C.muted,
    marginTop: 5,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 17,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFFF5',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 14,
    color: C.navy,
  },
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
    paddingVertical: 7,
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.navy,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '600',
    color: C.muted,
  },
  filtersPanel: {
    borderRadius: 19,
    backgroundColor: '#FFFFFFE8',
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
    marginBottom: 17,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  sortChip: {
    backgroundColor: '#F1F7FC',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sortChipActive: {
    backgroundColor: C.yellowLight,
    borderColor: '#E4B400',
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.muted,
  },
  sortChipTextActive: {
    color: C.navy,
  },
  filterBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#8CAAC5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: C.yellow,
    borderColor: '#E4B400',
  },
  checkboxLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.navy,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.blue,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.navy,
  },
  sectionBadge: {
    borderRadius: 10,
    backgroundColor: '#D7ECFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.blue,
  },
  serviceCard: {
    backgroundColor: '#FFFFFFF5',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.white,
    shadowColor: '#2D70A4',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.8,
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
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  serviceMetaText: {
    fontSize: 12,
    color: C.muted,
  },
  serviceDivider: {
    height: 1,
    backgroundColor: '#EAF1F7',
    marginVertical: 14,
  },
  serviceBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  serviceBottomLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF7FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  metaPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.navy,
  },
  workshopText: {
    flex: 1,
    fontSize: 12,
    color: C.muted,
  },
  serviceCostContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  serviceCost: {
    fontSize: 17,
    fontWeight: '800',
    color: C.navy,
  },
  serviceCurrency: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
  },
  bottomBar: {
    backgroundColor: '#FFFFFFF0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#E1EDF7',
  },
  addButton: {
    backgroundColor: C.yellow,
    borderRadius: 17,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.navy,
  },
  statusCard: {
    borderRadius: 19,
    padding: 24,
    backgroundColor: '#FFFFFFE8',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: C.muted,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyCard: {
    borderRadius: 22,
    padding: 28,
    backgroundColor: '#FFFFFFE8',
    alignItems: 'center',
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: C.navy,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    color: C.muted,
    textAlign: 'center',
    marginTop: 9,
  },
  yellowButton: {
    backgroundColor: C.yellow,
    borderRadius: 15,
    paddingHorizontal: 23,
    paddingVertical: 13,
    marginTop: 18,
  },
  yellowButtonText: {
    color: C.navy,
    fontSize: 14,
    fontWeight: '800',
  },
  footerSpace: {
    height: 20,
  },
});
