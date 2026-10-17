
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    router,
    Stack,
    useLocalSearchParams,
} from 'expo-router';
import {
    ArrowLeft,
    CalendarDays,
    CarFront,
    ChevronRight,
    ClipboardList,
    Coins,
    FileText,
    Gauge,
    MapPin,
    Pencil,
    Trash2,
    Wrench,
} from 'lucide-react-native';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { api } from '../../../lib/api';
import { useCar } from '../../features/cars/hooks/useCars';

const COLORS = {
  navy: '#092344',
  blue: '#0872D5',
  muted: '#58799D',
  sky: '#DDF1FF',
  yellow: '#FFD43B',
  yellowLight: '#FFF5D5',
  white: '#FFFFFF',
  border: '#E3EDF6',
  danger: '#CF5555',
};

interface ApiServiceRecord {
  id: string;
  carId: string;
  date: string;
  mileage: number;
  title: string;
  description?: string | null;
  cost?: string | number | null;
  currency: string;
  workshop?: string | null;
  createdAt: string;
}

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function fetchService(
  carId: string,
  serviceId: string,
): Promise<ApiServiceRecord> {
  const response = await api.get<ApiServiceRecord>(
    `/cars/${carId}/services/${serviceId}`,
  );

  return response.data;
}

async function deleteService(
  carId: string,
  serviceId: string,
): Promise<void> {
  await api.delete(
    `/cars/${carId}/services/${serviceId}`,
  );
}

function formatDate(value: string) {
  const date = new Date(
    `${value.slice(0, 10)}T00:00:00`,
  );

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

function formatCost(
  value: string | number | null | undefined,
) {
  if (value === null || value === undefined) {
    return 'Not specified';
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 'Not specified';
  }

  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getServiceCategory(title: string) {
  const value = title.toLowerCase();

  if (
    value.includes('масл') ||
    value.includes('oil')
  ) {
    return 'Oil & fluids';
  }

  if (
    value.includes('свеч') ||
    value.includes('spark')
  ) {
    return 'Ignition system';
  }

  if (
    value.includes('тормоз') ||
    value.includes('brake')
  ) {
    return 'Braking system';
  }

  if (
    value.includes('фильтр') ||
    value.includes('filter')
  ) {
    return 'Filters';
  }

  return 'Maintenance';
}

export default function ServiceDetailsScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    carId?: string | string[];
    vehicleId?: string | string[];
  }>();

  const serviceId = firstParam(params.id);

  const carId =
    firstParam(params.carId) ??
    firstParam(params.vehicleId);

  const queryClient = useQueryClient();

  const serviceQuery = useQuery({
    queryKey: [
      'cars',
      carId,
      'services',
      serviceId,
    ],
    queryFn: () => fetchService(carId!, serviceId!),
    enabled: Boolean(carId && serviceId),
  });

  const service = serviceQuery.data;
  const carQuery = useCar(carId);

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!carId || !serviceId) {
        throw new Error('Missing car or service ID');
      }

      return deleteService(carId, serviceId);
    },

    onSuccess: async () => {
      queryClient.removeQueries({
        queryKey: [
          'cars',
          carId,
          'services',
          serviceId,
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: ['cars', carId, 'services'],
      });
    },
  });

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/services');
    }
  };

  const handleDelete = () => {
    if (!service || deleteMutation.isPending) {
      return;
    }

    Alert.alert(
      'Delete service record?',
      `Delete "${service.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync();

              router.replace({
                pathname: '/car/[id]',
                params: { id: service.carId },
              });
            } catch (error) {
              Alert.alert(
                'Could not delete service',
                error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred.',
              );
            }
          },
        },
      ],
    );
  };

  const openEdit = () => {
    if (!service) return;

    router.push({
      pathname: '/service/edit',
      params: {
        id: service.id,
        carId: service.carId,
      },
    });
  };

  const car = carQuery.data;

  const costText = service
    ? service.cost === null ||
      service.cost === undefined
      ? 'Not specified'
      : `${formatCost(service.cost)} ${
          service.currency || 'BYN'
        }`
    : '—';

  const carName = car
    ? `${car.make} ${car.model}`
    : carQuery.isLoading
      ? 'Loading vehicle...'
      : 'Vehicle unavailable';

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{ headerShown: false }}
      />

      <ImageBackground
        source={require('../../../assets/images/lovablecar-main-background.png')}
        resizeMode="cover"
        style={styles.background}
        blurRadius={12}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* CUSTOM HEADER */}
          <View style={styles.topbar}>
            <Pressable
              style={styles.backButton}
              onPress={goBack}
              hitSlop={10}
            >
              <ArrowLeft
                size={22}
                color={COLORS.navy}
              />
            </Pressable>

            <Text style={styles.topTitle}>
              Service Details
            </Text>

            <Pressable
              style={[
                styles.editPill,
                !service && styles.disabled,
              ]}
              onPress={openEdit}
              disabled={!service}
            >
              <Pencil
                size={15}
                color={COLORS.navy}
              />
              <Text style={styles.editPillText}>
                Edit
              </Text>
            </Pressable>
          </View>

          {!carId || !serviceId ? (
            <StateCard
              title="Missing service information"
              description="Open a service record from your service history."
              onRetry={() =>
                router.replace('/(tabs)/services')
              }
              buttonText="Back to services"
            />
          ) : serviceQuery.isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator
                size="large"
                color={COLORS.blue}
              />
              <Text style={styles.mutedText}>
                Loading service details...
              </Text>
            </View>
          ) : serviceQuery.isError ? (
            <StateCard
              title="Could not load service"
              description={
                serviceQuery.error instanceof Error
                  ? serviceQuery.error.message
                  : 'Please check your connection.'
              }
              onRetry={() =>
                void serviceQuery.refetch()
              }
              buttonText="Try again"
            />
          ) : !service ? (
            <StateCard
              title="Service not found"
              description="This service may have been deleted."
              onRetry={() =>
                router.replace('/(tabs)/services')
              }
              buttonText="Back to services"
            />
          ) : (
            <>
              {/* SERVICE HERO */}
              <View style={styles.hero}>
                <View style={styles.categoryBadge}>
                  <Wrench
                    size={14}
                    color={COLORS.navy}
                  />
                  <Text style={styles.categoryText}>
                    {getServiceCategory(service.title)}
                  </Text>
                </View>

                <Text style={styles.heroTitle}>
                  {service.title}
                </Text>

                <View style={styles.heroDate}>
                  <CalendarDays
                    size={17}
                    color={COLORS.yellow}
                  />
                  <Text style={styles.heroDateText}>
                    {formatDate(service.date)}
                  </Text>
                </View>

                {/* CAR ILLUSTRATION */}
                <View style={styles.heroCar}>
                  <View style={styles.carCircle}>
                    <CarFront
                      size={94}
                      strokeWidth={1.5}
                      color="#ffffff"
                    />
                  </View>

                  <View style={styles.carAccent} />
                </View>

                <View style={styles.heroVehicleBadge}>
                  <CarFront
                    size={16}
                    color={COLORS.navy}
                  />
                  <Text style={styles.heroVehicleText}>
                    {carName}
                  </Text>
                </View>
              </View>

              {/* QUICK INFORMATION */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <View style={styles.statIconBlue}>
                    <Gauge
                      size={21}
                      color={COLORS.blue}
                    />
                  </View>

                  <Text
                    style={styles.statValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatNumber(service.mileage)}
                  </Text>

                  <Text style={styles.statLabel}>
                    Mileage, km
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <View style={styles.statIconYellow}>
                    <Coins
                      size={21}
                      color={COLORS.navy}
                    />
                  </View>

                  <Text
                    style={styles.statValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {formatCost(service.cost)}
                  </Text>

                  <Text style={styles.statLabel}>
                    {service.currency || 'BYN'}
                  </Text>
                </View>
              </View>

              {/* SERVICE INFORMATION */}
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>
                  Service Information
                </Text>
              </View>

              <View style={styles.infoCard}>
                <DetailRow
                  icon={
                    <CalendarDays
                      size={19}
                      color={COLORS.navy}
                    />
                  }
                  label="Service date"
                  value={formatDate(service.date)}
                />

                <DetailRow
                  icon={
                    <Gauge
                      size={19}
                      color={COLORS.navy}
                    />
                  }
                  label="Mileage"
                  value={`${formatNumber(
                    service.mileage,
                  )} km`}
                />

                <DetailRow
                  icon={
                    <Coins
                      size={19}
                      color={COLORS.navy}
                    />
                  }
                  label="Total cost"
                  value={costText}
                />

                <DetailRow
                  icon={
                    <MapPin
                      size={19}
                      color={COLORS.navy}
                    />
                  }
                  label="Workshop"
                  value={service.workshop || 'Not specified'}
                  last
                />
              </View>

              {/* DESCRIPTION */}
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>
                  Description
                </Text>
              </View>

              <View style={styles.descriptionCard}>
                <View style={styles.descriptionHeader}>
                  <View style={styles.descriptionIcon}>
                    <FileText
                      size={20}
                      color={COLORS.blue}
                    />
                  </View>

                  <Text style={styles.descriptionLabel}>
                    Work performed
                  </Text>
                </View>

                <Text style={styles.descriptionText}>
                  {service.description?.trim() ||
                    'No additional description provided for this service.'}
                </Text>
              </View>

              {/* VEHICLE */}
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>
                  Vehicle
                </Text>
              </View>

              <Pressable
                style={styles.vehicleCard}
                onPress={() =>
                  router.push({
                    pathname: '/car/[id]',
                    params: { id: service.carId },
                  })
                }
              >
                <View style={styles.vehicleIcon}>
                  <CarFront
                    size={29}
                    color={COLORS.navy}
                  />
                </View>

                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>
                    {carName}
                  </Text>

                  <Text style={styles.vehicleSubtitle}>
                    {car
                      ? `${car.year}${
                          car.engine
                            ? ` · ${car.engine}`
                            : ''
                        }`
                      : 'View vehicle details'}
                  </Text>
                </View>

                <ChevronRight
                  size={21}
                  color="#819DB8"
                />
              </Pressable>

              {/* RECORD INFORMATION */}
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>
                  Record Information
                </Text>
              </View>

              <View style={styles.recordCard}>
                <View style={styles.recordIcon}>
                  <ClipboardList
                    size={19}
                    color={COLORS.blue}
                  />
                </View>

                <View style={styles.recordBody}>
                  <Text style={styles.recordLabel}>
                    Record created
                  </Text>

                  <Text style={styles.recordValue}>
                    {service.createdAt
                      ? formatDate(service.createdAt)
                      : 'Not available'}
                  </Text>
                </View>
              </View>

              {/* ACTIONS */}
              <Pressable
                style={styles.primaryButton}
                onPress={openEdit}
              >
                <Pencil
                  size={19}
                  color={COLORS.navy}
                />
                <Text style={styles.primaryButtonText}>
                  Edit Service
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.deleteButton,
                  deleteMutation.isPending &&
                    styles.disabled,
                ]}
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2
                  size={17}
                  color={COLORS.danger}
                />
                <Text style={styles.deleteButtonText}>
                  {deleteMutation.isPending
                    ? 'Deleting service...'
                    : 'Delete Service'}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailRow,
        !last && styles.detailRowBorder,
      ]}
    >
      <View style={styles.detailIcon}>
        {icon}
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text style={styles.detailValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function StateCard({
  title,
  description,
  onRetry,
  buttonText,
}: {
  title: string;
  description: string;
  onRetry: () => void;
  buttonText: string;
}) {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <Wrench
          size={32}
          color={COLORS.blue}
        />
      </View>

      <Text style={styles.stateTitle}>
        {title}
      </Text>

      <Text style={styles.stateDescription}>
        {description}
      </Text>

      <Pressable
        style={styles.stateButton}
        onPress={onRetry}
      >
        <Text style={styles.stateButtonText}>
          {buttonText}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.sky,
  },

  background: {
    flex: 1,
    width: '100%',
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 55,
  },

  // HEADER

  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  topTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
  },

  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D6EFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
  },

  editPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },

  // HERO

  hero: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
  },

  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.yellow,
    marginBottom: 14,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.navy,
  },

  heroTitle: {
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '900',
    color: COLORS.navy,
    textAlign: 'center',
    letterSpacing: -0.7,
    paddingHorizontal: 8,
  },

  heroDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 11,
  },

  heroDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffd43b',
  },

  heroCar: {
    width: '100%',
    height: 145,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  carCircle: {
    width: 140,
    height: 125,
    alignItems: 'center',
    justifyContent: 'center',
  },

  carAccent: {
    width: 110,
    height: 6,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    marginTop: -14,
  },

  heroVehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#FFFFFFD9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  heroVehicleText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
  },

  // STATISTICS

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 8,
  },

  statCard: {
    flex: 1,
    minHeight: 137,
    borderRadius: 20,
    backgroundColor: '#FFFFFFF0',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  statIconBlue: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  statIconYellow: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#FFF0B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  statValue: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.navy,
  },

  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 4,
  },

  // SECTIONS

  sectionHeading: {
    marginTop: 24,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.navy,
  },

  // DETAILS CARD

  infoCard: {
    backgroundColor: '#FFFFFFF2',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 3,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },

  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EAF1F7',
  },

  detailIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: '#EFF7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailContent: {
    flex: 1,
    gap: 4,
  },

  detailLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    lineHeight: 20,
  },

  // DESCRIPTION

  descriptionCard: {
    backgroundColor: '#FFFFFFF2',
    borderRadius: 20,
    padding: 17,
  },

  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 13,
  },

  descriptionIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  descriptionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
  },

  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#41658E',
  },

  // VEHICLE

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFFF2',
    borderRadius: 20,
    padding: 15,
  },

  vehicleIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFDC60',
    alignItems: 'center',
    justifyContent: 'center',
  },

  vehicleInfo: {
    flex: 1,
  },

  vehicleName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },

  vehicleSubtitle: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 5,
  },

  // RECORD

  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFFF2',
    borderRadius: 18,
    padding: 15,
  },

  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  recordBody: {
    flex: 1,
    gap: 4,
  },

  recordLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },

  recordValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },

  // ACTIONS

  primaryButton: {
    height: 54,
    backgroundColor: COLORS.yellow,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 26,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.navy,
  },

  deleteButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 15,
    marginTop: 10,
  },

  deleteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },

  disabled: {
    opacity: 0.5,
  },

  // STATES

  loadingCard: {
    backgroundColor: '#FFFFFFE8',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    gap: 14,
    marginTop: 30,
  },

  mutedText: {
    fontSize: 13,
    color: COLORS.muted,
  },

  stateCard: {
    backgroundColor: '#FFFFFFE8',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    marginTop: 35,
  },

  stateIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  stateTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.navy,
    textAlign: 'center',
  },

  stateDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 9,
  },

  stateButton: {
    backgroundColor: COLORS.yellow,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 13,
    marginTop: 22,
  },

  stateButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
});
