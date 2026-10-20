
import { Ionicons } from '@expo/vector-icons';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import {
    router,
    useLocalSearchParams,
} from 'expo-router';
import { useTranslation } from 'react-i18next';
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

import { api } from '@/../lib/api';
import { useCar } from '@/features/cars/model/useCars';

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type Schedule = {
  enabled: boolean;
  intervalKm: number | null;
  intervalMonths: number | null;
  nextDueMileage: number | null;
  nextDueDate: string | null;
  warningKm: number;
  warningDays: number;
};

type Service = {
  id: string;
  carId: string;
  date: string;
  mileage: number;
  title: string;
  description?: string | null;
  cost?: number | string | null;
  currency: string;
  workshop?: string | null;
  maintenanceSchedule?: Schedule | null;
};

type RouteParams = {
  id?: string | string[];
  serviceId?: string | string[];
  carId?: string | string[];
  vehicleId?: string | string[];
};

// --------------------------------------------------
// COLORS
// --------------------------------------------------

const COLORS = {
  navy: '#102647',
  blue: '#486B90',
  background: '#F1F8FF',
  white: '#FFFFFF',
  border: '#E2ECF5',
  divider: '#E8EFF6',
  lightBlue: '#EAF5FF',
  muted: '#8FB4D5',
  red: '#C44A4A',
  green: '#16834A',
};

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function first(
  value?: string | string[],
): string | undefined {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function formatDate(
  value: string | null | undefined,
  locale: string,
): string {
  if (!value) {
    return '—';
  }

  const date = new Date(
    `${value.slice(0, 10)}T12:00:00Z`,
  );

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// --------------------------------------------------
// DETAIL ROW
// --------------------------------------------------

type DetailRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
};

function DetailRow({
  icon,
  label,
  value,
  last = false,
}: DetailRowProps) {
  return (
    <View
      style={[
        styles.detailRow,
        !last && styles.divider,
      ]}
    >
      <Ionicons
        name={icon}
        size={21}
        color={COLORS.navy}
        style={styles.rowIcon}
      />

      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>
          {label}
        </Text>

        <Text style={styles.rowValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// --------------------------------------------------
// SCREEN
// --------------------------------------------------

export default function ServiceDetailsScreen() {
  const { i18n } = useTranslation();

  const isRussian =
    i18n.resolvedLanguage?.startsWith('ru') ??
    false;

  const tr = (
    english: string,
    russian: string,
  ) => (isRussian ? russian : english);

  const locale = isRussian
    ? 'ru-RU'
    : 'en-GB';

 const params = useLocalSearchParams<{
    id?: string | string[];
    serviceId?: string | string[];
    carId?: string | string[];
    vehicleId?: string | string[];
  }>();

  const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const serviceId =
  first(params.id) ||
  first(params.serviceId);

const routeCarId =
  first(params.carId) ||
  first(params.vehicleId);

  const queryClient = useQueryClient();

  const serviceQuery = useQuery({
    queryKey: [
      'service',
      serviceId,
      routeCarId,
    ],

    enabled: Boolean(serviceId),

    queryFn: async (): Promise<Service> => {
      if (!serviceId) {
        throw new Error('Missing service ID');
      }

      // When the caller supplied carId, preserve
      // the existing car-scoped endpoint.
      if (routeCarId) {
        const response = await api.get<Service>(
          `/cars/${routeCarId}/services/${serviceId}`,
        );

        return response.data;
      }

      // Home / Recent Services supplies only id.
      // Use the standalone service detail endpoint.
      const response = await api.get<Service>(
        `/service/${serviceId}`,
      );

      return response.data;
    },
  });

  const service = serviceQuery.data;

  // Resolve carId from the loaded service when
  // it was not included in route parameters.
  const carId =
    service?.carId ??
    routeCarId;

  const carQuery = useCar(carId);

  // --------------------------------------------------
  // DELETE SERVICE
  // --------------------------------------------------

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!serviceId || !carId) {
        throw new Error(
          'Missing service or car ID',
        );
      }

      await api.delete(
        `/cars/${carId}/services/${serviceId}`,
      );
    },

    onSuccess: async () => {
      queryClient.removeQueries({
        queryKey: [
          'service',
          serviceId,
          routeCarId,
        ],
      });

      queryClient.removeQueries({
        queryKey: [
          'cars',
          carId,
          'services',
          serviceId,
        ],
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            'cars',
            carId,
            'services',
          ],
        }),

        queryClient.invalidateQueries({
          queryKey: ['cars'],
        }),

        queryClient.invalidateQueries({
          queryKey: ['maintenance'],
        }),
      ]);

      router.replace({
        pathname: '/car/[id]',
        params: {
          id: carId!,
        },
      });
    },
  });

  // --------------------------------------------------
  // ACTIONS
  // --------------------------------------------------

  const handleEdit = () => {
    if (!serviceId || !carId) {
      return;
    }

    router.push({
      pathname: '/service/edit',
      params: {
        id: serviceId,
        carId,
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      tr(
        'Delete service?',
        'Удалить обслуживание?',
      ),
      tr(
        'This cannot be undone.',
        'Это действие нельзя отменить.',
      ),
      [
        {
          text: tr('Cancel', 'Отмена'),
          style: 'cancel',
        },
        {
          text: tr('Delete', 'Удалить'),
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(
              undefined,
              {
                onError: () => {
                  Alert.alert(
                    tr('Error', 'Ошибка'),
                    tr(
                      'Could not delete service.',
                      'Не удалось удалить обслуживание.',
                    ),
                  );
                },
              },
            );
          },
        },
      ],
    );
  };

  const openCar = () => {
    if (!carId) {
      router.push('/(tabs)/cars');
      return;
    }

    router.push({
      pathname: '/car/[id]',
      params: {
        id: carId,
      },
    });
  };

  // --------------------------------------------------
  // EMPTY / LOADING / ERROR STATES
  // --------------------------------------------------

  if (!serviceId) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          {tr(
            'Missing service ID',
            'Нет идентификатора обслуживания',
          )}
        </Text>

        <Pressable
          onPress={() =>
            router.replace('/(tabs)/cars')
          }
        >
          <Text style={styles.link}>
            {tr(
              'Back to cars',
              'К автомобилям',
            )}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (serviceQuery.isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#E9B900"
        />
      </View>
    );
  }

  if (serviceQuery.isError || !service) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          {tr(
            'Could not load service',
            'Не удалось загрузить обслуживание',
          )}
        </Text>

        <Pressable
          onPress={() =>
            void serviceQuery.refetch()
          }
        >
          <Text style={styles.link}>
            {tr('Try again', 'Повторить')}
          </Text>
        </Pressable>
      </View>
    );
  }

  // --------------------------------------------------
  // DISPLAY VALUES
  // --------------------------------------------------

  const cost =
    service.cost == null
      ? '—'
      : `${Number(service.cost).toLocaleString(
          locale,
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )} ${service.currency || 'PLN'}`;

  const schedule =
    service.maintenanceSchedule;

  const interval = [
    schedule?.intervalKm != null
      ? `${schedule.intervalKm.toLocaleString(
          locale,
        )} km`
      : null,

    schedule?.intervalMonths != null
      ? `${schedule.intervalMonths} ${tr(
          'months',
          'мес.',
        )}`
      : null,
  ]
    .filter(Boolean)
    .join(' / ') || '—';

  // --------------------------------------------------
  // CONTENT
  // --------------------------------------------------

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO */}

      <ImageBackground
        source={require(
          '../../../../assets/images/cars-hero.png'
        )}
        style={styles.hero}
        imageStyle={styles.heroImage}
        resizeMode="cover"
      >
        <View style={styles.navigation}>
          <Pressable
            style={styles.back}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.navy}
            />
          </Pressable>

          <Text style={styles.navigationTitle}>
            {tr(
              'Service Details',
              'Детали обслуживания',
            )}
          </Text>

          <Pressable
            style={styles.editPill}
            onPress={handleEdit}
          >
            <Text style={styles.editPillText}>
              {tr('Edit', 'Изменить')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.heroTitleBox}>
          <Text style={styles.heroTitle}>
            {service.title}
          </Text>

          <Text style={styles.heroDate}>
            {formatDate(
              service.date,
              locale,
            )}
          </Text>
        </View>
      </ImageBackground>

      {/* SERVICE DETAILS */}

      <View style={styles.detailsCard}>
        <DetailRow
          icon="speedometer-outline"
          label={tr('Mileage', 'Пробег')}
          value={`${service.mileage.toLocaleString(
            locale,
          )} km`}
        />

        <DetailRow
          icon="wallet-outline"
          label={tr(
            'Total cost',
            'Стоимость',
          )}
          value={cost}
        />

        <DetailRow
          icon="business-outline"
          label={tr(
            'Workshop',
            'Автосервис',
          )}
          value={service.workshop || '—'}
        />

        <View style={styles.descriptionRow}>
          <Ionicons
            name="document-text-outline"
            size={21}
            color={COLORS.navy}
          />

          <View style={styles.descriptionBody}>
            <Text style={styles.rowLabel}>
              {tr(
                'Description',
                'Описание',
              )}
            </Text>

            <Text style={styles.descriptionValue}>
              {service.description ||
                service.title}
            </Text>
          </View>
        </View>
      </View>

      {/* PHOTOS AND DOCUMENTS */}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          {tr(
            'Photos & Documents',
            'Фото и документы',
          )}
        </Text>

        <View style={styles.documentRow}>
          <View style={styles.documentTile}>
            <Ionicons
              name="document-text-outline"
              size={32}
              color={COLORS.muted}
            />
          </View>

          <View style={styles.documentTile}>
            <Ionicons
              name="add"
              size={32}
              color="#A8C5DF"
            />
          </View>
        </View>

        <Text style={styles.helper}>
          {tr(
            'Attachments are not yet available for this service.',
            'Вложения для этой записи пока недоступны.',
          )}
        </Text>
      </View>

      {/* MAINTENANCE REMINDER */}

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {tr(
              'Maintenance reminder',
              'Напоминание о ТО',
            )}
          </Text>

          <View
            style={[
              styles.status,
              schedule?.enabled &&
                styles.statusActive,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                schedule?.enabled &&
                  styles.statusTextActive,
              ]}
            >
              {schedule?.enabled
                ? tr('Active', 'Активно')
                : tr('Off', 'Выкл.')}
            </Text>
          </View>
        </View>

        {schedule?.enabled ? (
          <>
            <DetailRow
              icon="speedometer-outline"
              label={tr(
                'Next mileage',
                'Следующий пробег',
              )}
              value={
                schedule.nextDueMileage == null
                  ? '—'
                  : `${schedule.nextDueMileage.toLocaleString(
                      locale,
                    )} km`
              }
            />

            <DetailRow
              icon="calendar-outline"
              label={tr(
                'Next date',
                'Следующая дата',
              )}
              value={formatDate(
                schedule.nextDueDate,
                locale,
              )}
            />

            <DetailRow
              icon="repeat-outline"
              label={tr(
                'Interval',
                'Интервал',
              )}
              value={interval}
              last
            />
          </>
        ) : (
          <Text style={styles.helper}>
            {tr(
              'No active reminder for this service.',
              'Для этого обслуживания нет активного напоминания.',
            )}
          </Text>
        )}

        <Pressable
          style={styles.scheduleButton}
          onPress={handleEdit}
        >
          <Text style={styles.scheduleButtonText}>
            {tr(
              'Edit service and schedule',
              'Изменить обслуживание и график',
            )}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.navy}
          />
        </Pressable>
      </View>

      {/* VEHICLE LINK */}

      {carQuery.data && (
        <Pressable
          style={styles.carLink}
          onPress={openCar}
        >
          <Ionicons
            name="car-sport-outline"
            size={22}
            color={COLORS.navy}
          />

          <Text style={styles.carLinkText}>
            {carQuery.data.make}{' '}
            {carQuery.data.model}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.blue}
          />
        </Pressable>
      )}

      {/* DELETE */}

      <Pressable
        style={styles.deleteButton}
        disabled={deleteMutation.isPending}
        onPress={handleDelete}
      >
        <Ionicons
          name="trash-outline"
          size={18}
          color={COLORS.red}
        />

        <Text style={styles.deleteText}>
          {deleteMutation.isPending
            ? tr(
                'Deleting...',
                'Удаление...',
              )
            : tr(
                'Delete service',
                'Удалить обслуживание',
              )}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingBottom: 44,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
    backgroundColor: COLORS.background,
  },

  link: {
    color: '#247DD0',
    fontWeight: '700',
  },

  error: {
    color: COLORS.red,
    textAlign: 'center',
  },

  // HERO

  hero: {
    height: 290,
    paddingTop: 52,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },

  heroImage: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  back: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },

  navigationTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
  },

  editPill: {
    backgroundColor: '#D5EFFF',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  editPillText: {
    color: COLORS.navy,
    fontWeight: '600',
  },

  heroTitleBox: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 17,
    padding: 15,
    marginBottom: 67,
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.navy,
  },

  heroDate: {
    fontSize: 15,
    color: COLORS.blue,
    marginTop: 7,
  },

  // DETAILS

  detailsCard: {
    marginHorizontal: 14,
    marginTop: -24,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    gap: 12,
  },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },

  rowIcon: {
    width: 24,
  },

  rowBody: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  rowLabel: {
    color: COLORS.blue,
    fontSize: 13,
  },

  rowValue: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },

  descriptionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },

  descriptionBody: {
    flex: 1,
    gap: 7,
  },

  descriptionValue: {
    color: COLORS.navy,
    fontSize: 13,
    lineHeight: 19,
  },

  // SECTION CARDS

  sectionCard: {
    marginHorizontal: 14,
    marginTop: 14,
    padding: 17,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E5EEF6',
  },

  sectionTitle: {
    color: COLORS.navy,
    fontWeight: '800',
    fontSize: 15,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  // DOCUMENTS

  documentRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 15,
  },

  documentTile: {
    width: 76,
    height: 86,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#F3F9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  helper: {
    color: COLORS.blue,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
  },

  // MAINTENANCE

  status: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 11,
    backgroundColor: '#F1F3F6',
  },

  statusActive: {
    backgroundColor: '#DCF7E8',
  },

  statusText: {
    color: COLORS.blue,
    fontSize: 11,
    fontWeight: '700',
  },

  statusTextActive: {
    color: COLORS.green,
  },

  scheduleButton: {
    backgroundColor: COLORS.lightBlue,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },

  scheduleButtonText: {
    fontSize: 13,
    color: COLORS.navy,
    fontWeight: '700',
    flex: 1,
  },

  // VEHICLE LINK

  carLink: {
    marginHorizontal: 14,
    marginTop: 14,
    backgroundColor: COLORS.white,
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  carLinkText: {
    flex: 1,
    color: COLORS.navy,
    fontWeight: '700',
  },

  // DELETE

  deleteButton: {
    alignSelf: 'center',
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },

  deleteText: {
    color: COLORS.red,
    fontWeight: '700',
  },
});
