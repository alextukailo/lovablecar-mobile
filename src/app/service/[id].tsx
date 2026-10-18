
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
    CarFront,
    ChevronRight,
    Coins,
    FileText,
    Gauge,
    ImagePlus,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '../../../lib/api';
import { useCar } from '../../features/cars/hooks/useCars';

const COLORS = {
  navy: '#102C4B',
  text: '#17365A',
  muted: '#607C9B',
  sky: '#DDF2FF',
  blue: '#1789E8',
  yellow: '#FFD23F',
  white: '#FFFFFF',
  border: '#E5EEF6',
  danger: '#D84B4B',
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

function firstParam(
  value?: string | string[],
): string | undefined {
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

function formatDate(value: string): string {
  const date = new Date(
    `${value.slice(0, 10)}T12:00:00`,
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

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatCost(
  value: string | number | null | undefined,
): string {
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

function DetailRow({
  icon,
  label,
  value,
  last = false,
  vertical = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
  vertical?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailRow,
        !last && styles.detailBorder,
        vertical && styles.verticalRow,
      ]}
    >
      <View style={styles.detailIcon}>
        {icon}
      </View>

      <View
        style={[
          styles.detailContent,
          vertical && styles.verticalContent,
        ]}
      >
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          style={[
            styles.detailValue,
            vertical && styles.descriptionValue,
          ]}
          numberOfLines={vertical ? undefined : 3}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function StateView({
  title,
  description,
  buttonText,
  onPress,
}: {
  title: string;
  description: string;
  buttonText: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.stateContainer}>
      <View style={styles.stateIcon}>
        <Wrench size={30} color={COLORS.blue} />
      </View>

      <Text style={styles.stateTitle}>
        {title}
      </Text>

      <Text style={styles.stateDescription}>
        {description}
      </Text>

      <Pressable
        style={styles.stateButton}
        onPress={onPress}
      >
        <Text style={styles.stateButtonText}>
          {buttonText}
        </Text>
      </Pressable>
    </View>
  );
}

export default function ServiceDetailsScreen() {
  const insets = useSafeAreaInsets();

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

  const carQuery = useCar(carId);

  const service = serviceQuery.data;
  const car = carQuery.data;

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

  const handleDelete = () => {
    if (!service || deleteMutation.isPending) {
      return;
    }

    Alert.alert(
      'Delete service?',
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
                params: {
                  id: service.carId,
                },
              });
            } catch (error) {
              Alert.alert(
                'Could not delete service',
                error instanceof Error
                  ? error.message
                  : 'Please try again.',
              );
            }
          },
        },
      ],
    );
  };

  const carName = car
    ? `${car.make} ${car.model}`
    : 'Vehicle';

  const costText = service
    ? service.cost === null ||
      service.cost === undefined
      ? 'Not specified'
      : `${formatCost(service.cost)} ${
          service.currency || 'BYN'
        }`
    : '—';

  const description =
    service?.description?.trim() ||
    service?.title ||
    'No description provided';

  const loading =
    Boolean(carId && serviceId) &&
    serviceQuery.isLoading;

  const renderContent = () => {
    if (!carId || !serviceId) {
      return (
        <StateView
          title="Missing service information"
          description="Open a service record from your service history."
          buttonText="Back to Services"
          onPress={() =>
            router.replace('/(tabs)/services')
          }
        />
      );
    }

    if (loading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color={COLORS.blue}
          />
          <Text style={styles.loadingText}>
            Loading service details...
          </Text>
        </View>
      );
    }

    if (serviceQuery.isError) {
      return (
        <StateView
          title="Could not load service"
          description={
            serviceQuery.error instanceof Error
              ? serviceQuery.error.message
              : 'Please check your connection.'
          }
          buttonText="Try Again"
          onPress={() =>
            void serviceQuery.refetch()
          }
        />
      );
    }

    if (!service) {
      return (
        <StateView
          title="Service not found"
          description="This service record may have been deleted."
          buttonText="Back to Services"
          onPress={() =>
            router.replace('/(tabs)/services')
          }
        />
      );
    }

    return (
      <>
        <View style={styles.heroTitleCard}>
          <Text style={styles.serviceTitle}>
            {service.title}
          </Text>

          <Text style={styles.serviceDate}>
            {formatDate(service.date)}
          </Text>
        </View>

        <View style={styles.heroSpacer} />

        <View style={styles.contentArea}>
          <View style={styles.detailsCard}>
            <DetailRow
              icon={
                <Gauge
                  size={20}
                  color={COLORS.text}
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
                  size={20}
                  color={COLORS.text}
                />
              }
              label="Total cost"
              value={costText}
            />

            <DetailRow
              icon={
                <MapPin
                  size={20}
                  color={COLORS.text}
                />
              }
              label="Workshop"
              value={
                service.workshop?.trim() ||
                'Not specified'
              }
            />

            <DetailRow
              icon={
                <FileText
                  size={20}
                  color={COLORS.text}
                />
              }
              label="Description"
              value={description}
              vertical
              last
            />
          </View>

          <View style={styles.documentsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Photos & Documents
              </Text>

              <View style={styles.documentCount}>
                <Text style={styles.documentCountText}>
                  0
                </Text>
              </View>
            </View>

            <View style={styles.documentsRow}>
              <View style={styles.emptyDocument}>
                <FileText
                  size={25}
                  color="#9DBBD6"
                />
                <Text style={styles.emptyDocumentText}>
                  No documents yet
                </Text>
              </View>

              <View style={styles.addDocumentTile}>
                <ImagePlus
                  size={27}
                  color="#A3C6E2"
                />
                <Text style={styles.addDocumentText}>
                  Add
                </Text>
              </View>
            </View>

            <Text style={styles.documentsHint}>
              Document attachments are not yet enabled
              for service records.
            </Text>
          </View>

          <Pressable
            style={styles.vehicleCard}
            onPress={() =>
              router.push({
                pathname: '/car/[id]',
                params: {
                  id: service.carId,
                },
              })
            }
          >
            <View style={styles.vehicleIcon}>
              <CarFront
                size={23}
                color={COLORS.text}
              />
            </View>

            <View style={styles.vehicleContent}>
              <Text style={styles.vehicleLabel}>
                Vehicle
              </Text>

              <Text style={styles.vehicleName}>
                {carName}
                {car ? ` · ${car.year}` : ''}
              </Text>
            </View>

            <ChevronRight
              size={20}
              color="#8AA7C2"
            />
          </Pressable>

          <Pressable
            style={styles.editButton}
            onPress={openEdit}
          >
            <Pencil
              size={19}
              color={COLORS.navy}
            />
            <Text style={styles.editButtonText}>
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
            {deleteMutation.isPending ? (
              <ActivityIndicator
                color={COLORS.danger}
              />
            ) : (
              <>
                <Trash2
                  size={18}
                  color={COLORS.danger}
                />
                <Text style={styles.deleteButtonText}>
                  Delete Service
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={require('../../../assets/images/cars-hero.png')}
          resizeMode="cover"
          imageStyle={styles.heroImage}
          style={[
            styles.hero,
            {
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <View style={styles.topbar}>
            <Pressable
              onPress={goBack}
              style={styles.backButton}
              hitSlop={10}
              accessibilityLabel="Go back"
            >
              <ArrowLeft
                size={24}
                color={COLORS.navy}
              />
            </Pressable>

            <Text style={styles.topbarTitle}>
              Service Details
            </Text>

            <Pressable
              onPress={openEdit}
              disabled={!service}
              style={[
                styles.editPill,
                !service && styles.disabled,
              ]}
            >
              <Text style={styles.editPillText}>
                Edit
              </Text>
            </Pressable>
          </View>

          {service && (
            <View style={styles.heroTitleCard}>
              <Text style={styles.serviceTitle}>
                {service.title}
              </Text>
              <Text style={styles.serviceDate}>
                {formatDate(service.date)}
              </Text>
            </View>
          )}
        </ImageBackground>

        <View style={styles.contentArea}>
          {service ? (
            <>
              <View style={styles.detailsCard}>
                <DetailRow
                  icon={<Gauge size={20} color={COLORS.text} />}
                  label="Mileage"
                  value={`${formatNumber(service.mileage)} km`}
                />
                <DetailRow
                  icon={<Coins size={20} color={COLORS.text} />}
                  label="Total cost"
                  value={costText}
                />
                <DetailRow
                  icon={<MapPin size={20} color={COLORS.text} />}
                  label="Workshop"
                  value={service.workshop?.trim() || 'Not specified'}
                />
                <DetailRow
                  icon={<FileText size={20} color={COLORS.text} />}
                  label="Description"
                  value={description}
                  vertical
                  last
                />
              </View>

              <View style={styles.documentsCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Photos & Documents
                  </Text>
                  <ChevronRight size={20} color="#8AA7C2" />
                </View>

                <View style={styles.documentsRow}>
                  <View style={styles.emptyDocument}>
                    <FileText size={26} color="#9DBBD6" />
                    <Text style={styles.emptyDocumentText}>
                      No documents yet
                    </Text>
                  </View>

                  <View style={styles.addDocumentTile}>
                    <ImagePlus size={28} color="#A3C6E2" />
                    <Text style={styles.addDocumentText}>Add</Text>
                  </View>
                </View>

                <Text style={styles.documentsHint}>
                  Attachments will be available once document storage
                  is connected to the backend.
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
                  <CarFront size={23} color={COLORS.text} />
                </View>
                <View style={styles.vehicleContent}>
                  <Text style={styles.vehicleLabel}>Vehicle</Text>
                  <Text style={styles.vehicleName}>
                    {carName}{car ? ` · ${car.year}` : ''}
                  </Text>
                </View>
                <ChevronRight size={20} color="#8AA7C2" />
              </Pressable>

              <Pressable style={styles.editButton} onPress={openEdit}>
                <Pencil size={19} color={COLORS.navy} />
                <Text style={styles.editButtonText}>
                  Edit Service
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.deleteButton,
                  deleteMutation.isPending && styles.disabled,
                ]}
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color={COLORS.danger} />
                ) : (
                  <>
                    <Trash2 size={18} color={COLORS.danger} />
                    <Text style={styles.deleteButtonText}>
                      Delete Service
                    </Text>
                  </>
                )}
              </Pressable>
            </>
          ) : (
            renderContent()
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5FAFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 45,
  },
  hero: {
    height: 295,
    backgroundColor: COLORS.sky,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  topbar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topbarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },
  editPill: {
    minWidth: 56,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#CDE9FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
  },
  heroTitleCard: {
    marginHorizontal: 24,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.89)',
    alignSelf: 'stretch',
  },
  serviceTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
    color: COLORS.navy,
  },
  serviceDate: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
    marginTop: 7,
  },
  heroSpacer: {
    height: 65,
  },
  contentArea: {
    marginTop: -19,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    backgroundColor: '#F7FBFF',
    paddingHorizontal: 23,
    paddingTop: 19,
    paddingBottom: 30,
    minHeight: 450,
  },
  detailsCard: {
    paddingHorizontal: 17,
    paddingVertical: 4,
    backgroundColor: COLORS.white,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#EDF3F9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 53,
    gap: 12,
  },
  detailBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailIcon: {
    width: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
  },
  detailValue: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'right',
    lineHeight: 19,
  },
  verticalRow: {
    alignItems: 'flex-start',
    paddingTop: 14,
    paddingBottom: 15,
  },
  verticalContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  descriptionValue: {
    textAlign: 'left',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
    color: COLORS.text,
  },
  documentsCard: {
    marginTop: 16,
    padding: 15,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EDF3F9',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
  documentCount: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EAF5FE',
    borderRadius: 9,
  },
  documentCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  documentsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyDocument: {
    width: 112,
    height: 95,
    borderRadius: 13,
    backgroundColor: '#EDF6FE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  emptyDocumentText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.muted,
    textAlign: 'center',
  },
  addDocumentTile: {
    width: 85,
    height: 95,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#DFEBF6',
    backgroundColor: '#F7FBFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addDocumentText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.muted,
  },
  documentsHint: {
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.muted,
    marginTop: 12,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 15,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#EDF3F9',
  },
  vehicleIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#E8F4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleContent: {
    flex: 1,
    gap: 4,
  },
  vehicleLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.navy,
  },
  editButton: {
    height: 54,
    marginTop: 24,
    borderRadius: 17,
    backgroundColor: COLORS.yellow,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },
  deleteButton: {
    height: 48,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.danger,
  },
  disabled: {
    opacity: 0.5,
  },
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  stateContainer: {
    padding: 24,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
  },
  stateIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#E8F4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
  },
  stateDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    textAlign: 'center',
  },
  stateButton: {
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 6,
  },
  stateButtonText: {
    fontWeight: '800',
    color: COLORS.navy,
  },
});
