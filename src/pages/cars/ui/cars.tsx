
import { useCarMaintenanceSchedules } from '@/../lib/maintenance.queries';
import { useCarStore } from '@/entities/car/model/car.store';
import { useCars } from '@/features/cars/model/useCars';
import CarPhoto from '@/features/cars/ui/CarPhoto';
import { calculateMaintenanceOverview } from '@/features/maintenance/lib/maintenance-overview';
import { router } from 'expo-router';
import {
    CalendarClock,
    CarFront,
    Check,
    ChevronRight,
    CircleAlert,
    Gauge,
    Plus,
    ShieldCheck,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  navy: '#092747',
  muted: '#617C9B',
  blue: '#1686D4',
  sky: '#E8F6FF',
  yellow: '#FFD443',
  border: '#E1EDF6',
  green: '#168E69',
  red: '#D35454',
  white: '#FFFFFF',
};

function MaintenanceStatus({
  carId,
  mileage,
}: {
  carId: string;
  mileage: number;
}) {
  const { t } = useTranslation();
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useCarMaintenanceSchedules(carId);

  if (isLoading) {
    return (
      <Text style={s.statusText}>
        {t('cars.checkingMaintenance', {
          defaultValue: 'Checking maintenance...',
        })}
      </Text>
    );
  }

  if (isError) {
    return (
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          void refetch();
        }}
        style={s.statusRow}
      >
        <CircleAlert size={15} color={C.red} />
        <Text style={[s.statusText, { color: C.red }]}>
          {t('cars.maintenanceUnavailable', {
            defaultValue: 'Maintenance unavailable · Retry',
          })}
        </Text>
      </Pressable>
    );
  }

  const { counts } = calculateMaintenanceOverview(
    data,
    mileage,
  );

  const overdue = counts.overdue > 0;
  const soon = counts.dueSoon > 0;
  const configured = counts.configured > 0;

  const color = overdue
    ? C.red
    : soon
      ? '#B88218'
      : configured
        ? C.green
        : C.muted;

  const message = overdue
    ? t('cars.overdueItems', {
        count: counts.overdue,
        defaultValue: '{{count}} overdue maintenance items',
      })
    : soon
      ? t('cars.upcomingItems', {
          count: counts.dueSoon,
          defaultValue: '{{count}} upcoming maintenance items',
        })
      : configured
        ? t('cars.maintenanceUpToDate', {
            defaultValue: 'Maintenance up to date',
          })
        : t('cars.setupReminders', {
            defaultValue: 'Set up maintenance reminders',
          });

  return (
    <View style={s.statusRow}>
      {configured && !overdue && !soon ? (
        <ShieldCheck size={16} color={color} />
      ) : (
        <CalendarClock size={16} color={color} />
      )}

      <Text style={[s.statusText, { color }]}>
        {message}
      </Text>
    </View>
  );
}

export default function CarsScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const {
    data: cars = [],
    isLoading,
    isError,
    refetch,
  } = useCars();

  const selectedId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  const currentId = cars.some(
    (car) => car.id === selectedId,
  )
    ? selectedId
    : cars.find((car) => car.isPrimary)?.id ??
      cars[0]?.id;

  const openCar = (id: string) => {
    selectCar(id);

    router.push({
      pathname: '/car/[id]',
      params: { id },
    });
  };

  const addCar = () => router.push('/car/new');

  const mileage = (value: number) =>
    value.toLocaleString(
      i18n.resolvedLanguage === 'ru'
        ? 'ru-RU'
        : 'en-US',
    );

  return (
    <View style={s.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 20) + 105,
        }}
      >
        <ImageBackground
          source={require(
            '../../../../assets/images/cars-hero.png'
          )}
          resizeMode="cover"
          style={[
            s.hero,
            { paddingTop: insets.top + 20 },
          ]}
        >
          <View style={s.heroHeader}>
            <View style={s.heroTextPanel}>
              <Text style={s.heading}>
                {t('cars.title', {
                  defaultValue: 'My Cars',
                })}
              </Text>

              <Text style={s.heroSubtitle}>
                {t('cars.garageSubtitle', {
                  defaultValue:
                    'Your garage, all in one place',
                })}
              </Text>
            </View>

            <Pressable
              onPress={addCar}
              style={s.heroAdd}
            >
              <Plus
                size={23}
                color={C.navy}
                strokeWidth={2.5}
              />
            </Pressable>
          </View>

          <View style={s.heroBottom}>
            <CarFront size={18} color={C.navy} />

            <Text style={s.heroCount}>
              {t('cars.garageCount', {
                count: cars.length,
                defaultValue:
                  '{{count}} vehicles in your garage',
              })}
            </Text>
          </View>
        </ImageBackground>

        <View style={s.body}>
          <View style={s.sectionHeading}>
            <Text style={s.sectionTitle}>
              {t('cars.yourVehicles', {
                defaultValue: 'Your vehicles',
              })}
            </Text>

            <Text style={s.sectionCount}>
              {t('cars.totalCount', {
                count: cars.length,
                defaultValue: '{{count}} total',
              })}
            </Text>
          </View>

          {isLoading && (
            <Text style={s.feedback}>
              {t('cars.loadingCars', {
                defaultValue: 'Loading cars...',
              })}
            </Text>
          )}

          {isError && (
            <Pressable
              style={s.empty}
              onPress={() => void refetch()}
            >
              <CircleAlert
                size={26}
                color={C.red}
              />

              <Text style={s.emptyTitle}>
                {t('cars.loadError', {
                  defaultValue: 'Could not load cars',
                })}
              </Text>

              <Text style={s.emptyCaption}>
                {t('cars.tapToRetry', {
                  defaultValue: 'Tap to retry',
                })}
              </Text>
            </Pressable>
          )}

          {!isLoading &&
            !isError &&
            cars.length === 0 && (
              <View style={s.empty}>
                <CarFront
                  size={42}
                  color={C.blue}
                />

                <Text style={s.emptyTitle}>
                  {t('cars.emptyGarage', {
                    defaultValue:
                      'Your garage is empty',
                  })}
                </Text>

                <Text style={s.emptyCaption}>
                  {t('cars.emptyDescription', {
                    defaultValue:
                      'Add a vehicle to track services, mileage and maintenance.',
                  })}
                </Text>

                <Pressable
                  style={s.primaryButton}
                  onPress={addCar}
                >
                  <Plus
                    size={18}
                    color={C.navy}
                  />

                  <Text style={s.primaryButtonText}>
                    {t('cars.addFirstCar', {
                      defaultValue:
                        'Add your first car',
                    })}
                  </Text>
                </Pressable>
              </View>
            )}

          {cars.map((car) => {
            const active = car.id === currentId;

            return (
              <Pressable
                key={car.id}
                onPress={() => openCar(car.id)}
                style={({ pressed }) => [
                  s.carCard,
                  active && s.activeCard,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <View style={s.cardTop}>
                  {/* CAR PHOTO THUMBNAIL */}
                  <CarPhoto
                    carId={car.id}
                    style={[
                      s.carIcon,
                      active && s.activeIcon,
                    ]}
                    iconSize={29}
                  />

                  <View style={s.carIdentity}>
                    <Text
                      style={s.carName}
                      numberOfLines={2}
                    >
                      {car.make} {car.model}
                    </Text>

                    <Text style={s.carMeta}>
                      {car.year}
                      {car.engine
                        ? `  ·  ${car.engine}`
                        : ''}
                    </Text>
                  </View>

                  <ChevronRight
                    size={21}
                    color="#8BA6BF"
                  />
                </View>

                {active && (
                  <View style={s.primaryBadge}>
                    <Check
                      size={13}
                      color={C.green}
                      strokeWidth={3}
                    />

                    <Text style={s.primaryLabel}>
                      {t('cars.currentVehicle', {
                        defaultValue:
                          'Current vehicle',
                      })}
                    </Text>
                  </View>
                )}

                <View style={s.divider} />

                <View style={s.mileageRow}>
                  <View style={s.mileageIcon}>
                    <Gauge
                      size={20}
                      color={C.blue}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>
                      {t('cars.currentMileage', {
                        defaultValue:
                          'CURRENT MILEAGE',
                      })}
                    </Text>

                    <Text style={s.mileageValue}>
                      {mileage(car.mileage)}{' '}
                      <Text style={s.km}>km</Text>
                    </Text>
                  </View>
                </View>

                <View style={s.maintenance}>
                  <MaintenanceStatus
                    carId={car.id}
                    mileage={car.mileage}
                  />
                </View>
              </Pressable>
            );
          })}

          {cars.length > 0 && (
            <Pressable
              style={s.addCard}
              onPress={addCar}
            >
              <View style={s.addIcon}>
                <Plus
                  size={22}
                  color={C.blue}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.addTitle}>
                  {t('cars.addAnotherCar', {
                    defaultValue:
                      'Add another car',
                  })}
                </Text>

                <Text style={s.addSubtitle}>
                  {t('cars.expandGarage', {
                    defaultValue:
                      'Expand your garage',
                  })}
                </Text>
              </View>

              <ChevronRight
                size={21}
                color={C.blue}
              />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F9FE',
  },

  hero: {
    minHeight: 280,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },

  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },

  heroTextPanel: {
    flex: 1,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: C.navy,
    letterSpacing: -0.8,
  },

  heroSubtitle: {
    fontSize: 14,
    color: C.navy,
    marginTop: 5,
    lineHeight: 19,
    fontWeight: '600',
  },

  heroAdd: {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 9,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },

  heroCount: {
    color: C.navy,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    lineHeight: 18,
  },

  body: {
    paddingHorizontal: 18,
    paddingTop: 26,
  },

  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: C.navy,
  },

  sectionCount: {
    color: C.muted,
    fontSize: 13,
    fontWeight: '600',
  },

  feedback: {
    color: C.muted,
    marginVertical: 24,
    textAlign: 'center',
  },

  carCard: {
    backgroundColor: C.white,
    borderRadius: 23,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#235A82',
    shadowOpacity: 0.06,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 2,
  },

  activeCard: {
    borderColor: '#A9DDF9',
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  carIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#EDF7FF',
    borderRadius: 18,
    overflow: 'hidden',
  },

  activeIcon: {
    backgroundColor: '#DDF2FF',
  },

  carIdentity: {
    flex: 1,
  },

  carName: {
    color: C.navy,
    fontSize: 19,
    fontWeight: '800',
  },

  carMeta: {
    color: C.muted,
    fontSize: 13,
    marginTop: 5,
  },

  primaryBadge: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E8F8F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },

  primaryLabel: {
    color: C.green,
    fontSize: 12,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginVertical: 17,
  },

  mileageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  mileageIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#F1F8FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fieldLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '800',
    color: C.muted,
  },

  mileageValue: {
    fontSize: 23,
    fontWeight: '800',
    color: C.navy,
    marginTop: 3,
  },

  km: {
    fontSize: 13,
    fontWeight: '500',
    color: C.muted,
  },

  maintenance: {
    marginTop: 17,
    backgroundColor: '#F5FAFE',
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 13,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.muted,
    flexShrink: 1,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 17,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },

  detailsText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.blue,
  },

  addCard: {
    backgroundColor: '#EAF6FF',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#A7D4F1',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  addIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.navy,
  },

  addSubtitle: {
    fontSize: 12,
    color: C.muted,
    marginTop: 4,
  },

  empty: {
    backgroundColor: C.white,
    borderRadius: 22,
    alignItems: 'center',
    padding: 30,
    gap: 12,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: C.navy,
  },

  emptyCaption: {
    color: C.muted,
    textAlign: 'center',
    lineHeight: 21,
  },

  primaryButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: C.yellow,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: C.navy,
  },
});
