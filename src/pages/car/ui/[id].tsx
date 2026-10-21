
import { COLORS, styles } from '@/pages/car/ui/[id].styles';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import type { ApiMaintenanceSchedule } from '@/../lib/maintenance.api';
import { useCarMaintenanceSchedules } from '@/../lib/maintenance.queries';
import { useCarStore } from '@/entities/car/model/car.store';
import {
    refreshCarPhoto,
    useCarPhoto,
    useDeleteCarPhoto,
} from '@/features/cars/model/useCarPhoto';
import { useCar, useDeleteCar } from '@/features/cars/model/useCars';
import { calculateMaintenanceStatus } from '@/features/maintenance/lib/maintenance-status';

interface ApiService {
  id: string;
  date: string;
  mileage: number;
  title: string;
  cost?: string | number | null;
  currency?: string | null;
  workshop?: string | null;
}

async function fetchCarServices(
  carId: string,
): Promise<ApiService[]> {
  const response = await api.get<ApiService[]>(
    `/cars/${carId}/services`,
  );

  return response.data;
}

const maintenanceKeys: Record<string, string> = {
  ENGINE_OIL: 'engineOil',
  TRANSMISSION_OIL: 'transmissionOil',
  BRAKE_FLUID: 'brakeFluid',
  HALDEX_OIL: 'haldexOil',
};

function maintenanceName(
  schedule: ApiMaintenanceSchedule,
  t: (key: string) => string,
): string {
  if (schedule.type === 'CUSTOM') {
    return (
      schedule.customTitle ||
      t('carDetails.customMaintenance')
    );
  }

  const key = maintenanceKeys[schedule.type];

  return key
    ? t(`carDetails.${key}`)
    : schedule.type.replace(/_/g, ' ');
}

function formatDate(
  date: string,
  language: string,
): string {
  const parsedDate = new Date(date);

  return Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString(
        language.startsWith('ru') ? 'ru-RU' : 'en-GB',
      );
}

function formatCost(
  cost: string | number | null | undefined,
  language: string,
): string {
  const numericCost = Number(cost ?? 0);

  return Number.isFinite(numericCost)
    ? numericCost.toLocaleString(
        language.startsWith('ru') ? 'ru-RU' : 'en-US',
        { maximumFractionDigits: 2 },
      )
    : '0';
}

function maintenanceInterval(
  schedule: ApiMaintenanceSchedule,
  t: (key: string, options?: any) => string,
  language: string,
): string {
  const parts: string[] = [];

  if (schedule.intervalKm != null) {
    parts.push(
      `${schedule.intervalKm.toLocaleString(
        language.startsWith('ru') ? 'ru-RU' : 'en-US',
      )} ${t('carDetails.km')}`,
    );
  }

  if (schedule.intervalMonths != null) {
    parts.push(
      t('carDetails.monthsCount', {
        count: schedule.intervalMonths,
      }),
    );
  }

  return parts.length > 0
    ? parts.join(' / ')
    : t('carDetails.notConfigured');
}

export default function CarDetailsScreen() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const tr = (en: string, ru: string) =>
    i18n.language.startsWith('ru') ? ru : en;

  const [uploadingPhoto, setUploadingPhoto] =
    useState(false);

  const [photoFailed, setPhotoFailed] =
    useState(false);

  const [showVehicleInfo, setShowVehicleInfo] =
    useState(false);

  const language = i18n.language;

  const params = useLocalSearchParams<{
    id: string | string[];
  }>();

  const carId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  const selectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const clearSelectedCar = useCarStore(
    (state) => state.clearSelectedCar,
  );

  const {
    data: car,
    isLoading: isLoadingCar,
    isError: isCarError,
    refetch: refetchCar,
  } = useCar(carId);

  const deleteCar = useDeleteCar();

  const {
    data: services = [],
    isLoading: isLoadingServices,
    isError: isServicesError,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['cars', carId, 'services'],
    queryFn: () => fetchCarServices(carId!),
    enabled: Boolean(carId) && Boolean(car),
  });

  const {
    data: maintenanceSchedules = [],
    isLoading: isLoadingMaintenance,
    isError: isMaintenanceError,
    refetch: refetchMaintenance,
  } = useCarMaintenanceSchedules(car?.id);

  // CAR PHOTO

  const { data: photoData } = useCarPhoto(carId);

  const deletePhoto = useDeleteCarPhoto(carId ?? '');

  const carPhotoUrl = photoData?.url ?? null;

  useEffect(() => {
    setPhotoFailed(false);
  }, [carPhotoUrl]);

  const uploadPhoto = async (
    useCamera: boolean,
  ) => {
    if (!carId || uploadingPhoto) return;

    try {
      if (useCamera) {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            tr(
              'Camera permission required',
              'Нужен доступ к камере',
            ),
          );
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 1,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
            allowsEditing: false,
          });

      if (result.canceled || !result.assets.length) {
        return;
      }

      const asset = result.assets[0];

      const ext = (asset.fileName ?? '')
        .split('.')
        .pop()
        ?.toLowerCase();

      const mimeType =
        ext === 'heic'
          ? 'image/heic'
          : ext === 'heif'
            ? 'image/heif'
            : asset.mimeType || 'image/jpeg';

      const extensions: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/heic': 'heic',
        'image/heif': 'heif',
      };

      const suffix = extensions[mimeType];

      if (!suffix) {
        throw new Error(
          tr(
            'Unsupported image type',
            'Неподдерживаемый формат изображения',
          ),
        );
      }

      const info = await FileSystem.getInfoAsync(asset.uri);

      if (
        !info.exists ||
        info.isDirectory ||
        typeof info.size !== 'number'
      ) {
        throw new Error(
          tr(
            'Unable to read selected photo',
            'Не удалось прочитать фото',
          ),
        );
      }

      if (
        info.size <= 0 ||
        info.size > 10 * 1024 * 1024
      ) {
        throw new Error(
          tr(
            'Choose a photo under 10 MB',
            'Выберите фото размером до 10 МБ',
          ),
        );
      }

      const payload = {
        fileName:
          asset.fileName ||
          `car-photo-${Date.now()}.${suffix}`,
        mimeType,
        size: info.size,
      };

      setUploadingPhoto(true);

      const { data: prepared } = await api.post<{
        signedUrl: string;
        storageKey: string;
      }>(
        `/cars/${carId}/photo/upload-url`,
        payload,
      );

      const uploaded = await FileSystem.uploadAsync(
        prepared.signedUrl,
        asset.uri,
        {
          httpMethod: 'PUT',
          uploadType:
            FileSystem.FileSystemUploadType
              .BINARY_CONTENT,
          headers: {
            'Content-Type': mimeType,
          },
        },
      );

      if (
        uploaded.status < 200 ||
        uploaded.status >= 300
      ) {
        throw new Error(
          `Storage upload failed (${uploaded.status}): ` +
            uploaded.body.slice(0, 200),
        );
      }

      await api.post(`/cars/${carId}/photo`, {
        ...payload,
        storageKey: prepared.storageKey,
      });

      await refreshCarPhoto(
        queryClient,
        carId,
      );
    } catch (error) {
      Alert.alert(
        tr(
          'Photo upload failed',
          'Ошибка загрузки фото',
        ),
        error instanceof Error
          ? error.message
          : tr(
              'Please try again',
              'Попробуйте ещё раз',
            ),
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const openPhotoActions = () => {
    if (
      uploadingPhoto ||
      deletePhoto.isPending
    ) {
      return;
    }

    Alert.alert(
      tr('Car photo', 'Фото автомобиля'),
      tr(
        'Choose an action',
        'Выберите действие',
      ),
      [
        {
          text: tr(
            'Take photo',
            'Сделать фото',
          ),
          onPress: () =>
            void uploadPhoto(true),
        },
        {
          text: tr(
            'Choose from library',
            'Выбрать из галереи',
          ),
          onPress: () =>
            void uploadPhoto(false),
        },
        ...(carPhotoUrl
          ? [
              {
                text: tr(
                  'Delete photo',
                  'Удалить фото',
                ),
                style: 'destructive' as const,
                onPress: () => {
                  Alert.alert(
                    tr(
                      'Delete car photo?',
                      'Удалить фото автомобиля?',
                    ),
                    undefined,
                    [
                      {
                        text: tr(
                          'Cancel',
                          'Отмена',
                        ),
                        style: 'cancel',
                      },
                      {
                        text: tr(
                          'Delete',
                          'Удалить',
                        ),
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await deletePhoto.mutateAsync();
                          } catch (error) {
                            Alert.alert(
                              tr(
                                'Delete failed',
                                'Ошибка удаления',
                              ),
                              error instanceof Error
                                ? error.message
                                : '',
                            );
                          }
                        },
                      },
                    ],
                  );
                },
              },
            ]
          : []),
        {
          text: tr('Cancel', 'Отмена'),
          style: 'cancel',
        },
      ],
    );
  };

  // SELECT CURRENT CAR

  useEffect(() => {
    if (
      car &&
      selectedCarId !== car.id
    ) {
      selectCar(car.id);
    }
  }, [
    car?.id,
    selectedCarId,
    selectCar,
  ]);

  // SORTED SERVICES

  const sortedServices = useMemo(
    () =>
      [...services].sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime(),
      ),
    [services],
  );

  // SPENDING

  const totalsByCurrency = useMemo(
    () =>
      sortedServices.reduce<
        Record<string, number>
      >((totals, service) => {
        const currency =
          service.currency ||
          t('carDetails.unknown');

        const cost = Number(
          service.cost ?? 0,
        );

        if (Number.isFinite(cost)) {
          totals[currency] =
            (totals[currency] ?? 0) + cost;
        }

        return totals;
      }, {}),
    [sortedServices, t],
  );

  // MAINTENANCE STATUS

  const maintenanceCounts = useMemo(() => {
    const counts = {
      overdue: 0,
      dueSoon: 0,
      upcoming: 0,
    };

    if (!car) return counts;

    for (const schedule of maintenanceSchedules) {
      const status =
        calculateMaintenanceStatus(
          schedule,
          car.mileage,
        ).status;

      if (status === 'OVERDUE') {
        counts.overdue += 1;
      } else if (status === 'DUE_SOON') {
        counts.dueSoon += 1;
      } else if (status === 'UPCOMING') {
        counts.upcoming += 1;
      }
    }

    return counts;
  }, [
    maintenanceSchedules,
    car?.mileage,
  ]);

  const handleDelete = () => {
    if (
      !car ||
      deleteCar.isPending
    ) {
      return;
    }

    Alert.alert(
      t('carDetails.deleteCarTitle'),
      t('carDetails.deleteCarMessage', {
        car: `${car.make} ${car.model}`,
      }),
      [
        {
          text: t('carDetails.cancel'),
          style: 'cancel',
        },
        {
          text: t('carDetails.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCar.mutateAsync(
                car.id,
              );

              if (
                selectedCarId === car.id
              ) {
                clearSelectedCar();
              }

              router.replace(
                '/(tabs)/cars',
              );
            } catch (error) {
              console.error(
                'Failed to delete car:',
                error,
              );

              Alert.alert(
                t('carDetails.deleteError'),
                t(
                  'carDetails.deleteErrorDescription',
                ),
              );
            }
          },
        },
      ],
    );
  };

  const openService = (
    serviceId: string,
  ) => {
    if (!car) return;

    router.push({
      pathname: '/service/[id]',
      params: {
        id: serviceId,
        vehicleId: car.id,
      },
    });
  };

  const openNewService = () => {
    if (!car) return;

    router.push({
      pathname: '/service/new',
      params: {
        vehicleId: car.id,
      },
    });
  };

  const openMaintenance = (
    schedule: ApiMaintenanceSchedule,
  ) => {
    if (!car) return;

    if (
      schedule.sourceServiceRecordId
    ) {
      router.push({
        pathname: '/service/edit',
        params: {
          id: schedule.sourceServiceRecordId,
          carId: car.id,
        },
      });

      return;
    }

    router.push({
      pathname: '/maintenance/[id]',
      params: {
        id: schedule.id,
        carId: car.id,
      },
    });
  };

  // LOADING

  if (isLoadingCar) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator
          size="large"
          color="#246BFD"
        />

        <Text style={styles.emptyDescription}>
          {t('carDetails.loading')}
        </Text>
      </View>
    );
  }

  // ERROR

  if (isCarError) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          {t('carDetails.loadError')}
        </Text>

        <Text style={styles.emptyDescription}>
          {t('carDetails.connectionError')}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            void refetchCar()
          }
        >
          <Text style={styles.primaryButtonText}>
            {t('carDetails.retry')}
          </Text>
        </Pressable>
      </View>
    );
  }

  // NOT FOUND

  if (!car) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          {t('carDetails.notFound')}
        </Text>

        <Text style={styles.emptyDescription}>
          {t(
            'carDetails.notFoundDescription',
          )}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.replace(
              '/(tabs)/cars',
            )
          }
        >
          <Text style={styles.primaryButtonText}>
            {t(
              'carDetails.backToCars',
            )}
          </Text>
        </Pressable>
      </View>
    );
  }

  const moneySummary =
    Object.entries(totalsByCurrency)
      .map(
        ([currency, amount]) =>
          `${formatCost(
            amount,
            language,
          )} ${currency}`,
      )
      .join(' · ');

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* TOP BAR */}

        <View style={styles.topbar}>
          <Pressable
            onPress={() =>
              router.back()
            }
            style={styles.iconButton}
            hitSlop={10}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={COLORS.navy}
            />
          </Pressable>

          <Text style={styles.topbarTitle}>
            {t('carDetails.myVehicle')}
          </Text>

          <Pressable
            style={styles.iconButton}
            onPress={() =>
              router.push({
                pathname: '/car/edit',
                params: {
                  id: car.id,
                },
              })
            }
          >
            <Ionicons
              name="create-outline"
              size={21}
              color={COLORS.navy}
            />
          </Pressable>
        </View>

        {/* CAR HERO */}

        <ImageBackground
          source={
            carPhotoUrl && !photoFailed
              ? {
                  uri: carPhotoUrl,
                }
              : require(
                  '../../../../assets/images/cars-hero.png'
                )
          }
          style={styles.hero}
          imageStyle={styles.heroImage}
          onError={() =>
            setPhotoFailed(true)
          }
        >
          <View style={styles.heroTop}>
            <View style={styles.heroTag}>
              <Ionicons
                name="car-sport"
                size={13}
                color={COLORS.navy}
              />

              <Text style={styles.heroTagText}>
                {car.isPrimary
                  ? t(
                      'carDetails.primaryVehicle',
                    )
                  : t(
                      'carDetails.myVehicleUpper',
                    )}
              </Text>
            </View>

            {/* PHOTO BUTTON */}

            <Pressable
              onPress={
                openPhotoActions
              }
              disabled={
                uploadingPhoto ||
                deletePhoto.isPending
              }
              accessibilityRole="button"
              accessibilityLabel={tr(
                'Change car photo',
                'Изменить фото автомобиля',
              )}
              style={
                photoStyles.cameraButton
              }
            >
              {uploadingPhoto ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.navy}
                />
              ) : (
                <Ionicons
                  name="camera-outline"
                  size={23}
                  color={COLORS.navy}
                />
              )}
            </Pressable>
          </View>

          {/* READABLE VEHICLE TITLE */}

          <View style={photoStyles.vehicleTitlePanel}>
            <Text
              style={photoStyles.vehicleTitle}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {car.make} {car.model}
            </Text>

            <Text style={photoStyles.vehicleSubtitle}>
              {car.year}
              {car.engine
                ? `  ·  ${car.engine}`
                : ''}
            </Text>
          </View>

          <View style={styles.heroSpacer} />

          <View style={styles.mileagePill}>
            <Ionicons
              name="speedometer-outline"
              size={20}
              color={COLORS.navy}
            />

            <View>
              <Text style={styles.mileageCaption}>
                {t(
                  'carDetails.currentMileage',
                )}
              </Text>

              <Text style={styles.mileageText}>
                {car.mileage.toLocaleString(
                  language.startsWith('ru')
                    ? 'ru-RU'
                    : 'en-US',
                )}{' '}
                <Text style={styles.mileageUnit}>
                  {t('carDetails.km')}
                </Text>
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* QUICK STATS */}

        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Ionicons
              name="construct-outline"
              size={21}
              color={COLORS.blue}
            />

            <Text style={styles.quickStatValue}>
              {sortedServices.length}
            </Text>

            <Text style={styles.quickStatLabel}>
              {t('carDetails.services')}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.quickStat}>
            <Ionicons
              name="calendar-outline"
              size={21}
              color={COLORS.blue}
            />

            <Text style={styles.quickStatValue}>
              {maintenanceSchedules.length}
            </Text>

            <Text style={styles.quickStatLabel}>
              {t('carDetails.reminders')}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.quickStat}>
            <Ionicons
              name="alert-circle-outline"
              size={21}
              color={
                maintenanceCounts.overdue
                  ? COLORS.red
                  : COLORS.blue
              }
            />

            <Text
              style={[
                styles.quickStatValue,
                maintenanceCounts.overdue > 0 && {
                  color: COLORS.red,
                },
              ]}
            >
              {maintenanceCounts.overdue}
            </Text>

            <Text style={styles.quickStatLabel}>
              {t('carDetails.overdue')}
            </Text>
          </View>
        </View>

        {/* MAINTENANCE HEADER */}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>
              {t('carDetails.stayOnTrack')}
            </Text>

            <Text style={styles.sectionTitle}>
              {t('carDetails.maintenance')}
            </Text>
          </View>

          <View style={styles.sectionIcon}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color={COLORS.navy}
            />
          </View>
        </View>

        {/* MAINTENANCE SUMMARY */}

        {maintenanceSchedules.length > 0 &&
          !isLoadingMaintenance &&
          !isMaintenanceError && (
            <View style={styles.statusSummary}>
              <StatusCount
                value={maintenanceCounts.overdue}
                label={t('carDetails.overdue')}
                color={COLORS.red}
              />

              <StatusCount
                value={maintenanceCounts.dueSoon}
                label={t('carDetails.dueSoon')}
                color={COLORS.orange}
              />

              <StatusCount
                value={maintenanceCounts.upcoming}
                label={t('carDetails.upcoming')}
                color={COLORS.green}
              />
            </View>
          )}

        {/* MAINTENANCE LIST */}

        {isLoadingMaintenance ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator
              color={COLORS.blue}
            />
          </View>
        ) : isMaintenanceError ? (
          <Pressable
            style={styles.emptyCard}
            onPress={() =>
              void refetchMaintenance()
            }
          >
            <Text style={styles.emptyText}>
              {t(
                'carDetails.maintenanceError',
              )}
            </Text>
          </Pressable>
        ) : maintenanceSchedules.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-outline"
              size={28}
              color={COLORS.blue}
            />

            <Text style={styles.emptyTitle}>
              {t(
                'carDetails.noMaintenance',
              )}
            </Text>

            <Text style={styles.emptyText}>
              {t(
                'carDetails.noMaintenanceDescription',
              )}
            </Text>

            <Pressable
              style={styles.inlineAction}
              onPress={
                openNewService
              }
            >
              <Text style={styles.inlineActionText}>
                {t(
                  'carDetails.addServiceArrow',
                )}
              </Text>
            </Pressable>
          </View>
        ) : (
          maintenanceSchedules.map(
            (schedule) => {
              const result =
                calculateMaintenanceStatus(
                  schedule,
                  car.mileage,
                );

              const tone =
                result.status === 'OVERDUE'
                  ? COLORS.red
                  : result.status === 'DUE_SOON'
                    ? COLORS.orange
                    : result.status === 'UPCOMING'
                      ? COLORS.green
                      : COLORS.muted;

              const tint =
                result.status === 'OVERDUE'
                  ? '#FFF0EF'
                  : result.status === 'DUE_SOON'
                    ? '#FFF6E5'
                    : result.status === 'UPCOMING'
                      ? '#EAF8F0'
                      : '#F1F4F7';

              return (
                <Pressable
                  key={schedule.id}
                  style={
                    styles.scheduleCard
                  }
                  onPress={() =>
                    openMaintenance(
                      schedule,
                    )
                  }
                >
                  <View style={styles.scheduleTop}>
                    <View style={styles.scheduleIcon}>
                      <Ionicons
                        name="build-outline"
                        size={20}
                        color={COLORS.blue}
                      />
                    </View>

                    <View style={styles.scheduleMain}>
                      <Text
                        style={styles.scheduleName}
                        numberOfLines={2}
                      >
                        {maintenanceName(
                          schedule,
                          t,
                        )}
                      </Text>

                      <Text style={styles.scheduleInterval}>
                        {t(
                          'carDetails.every',
                          {
                            interval:
                              maintenanceInterval(
                                schedule,
                                t,
                                language,
                              ),
                          },
                        )}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={COLORS.muted}
                    />
                  </View>

                  <View style={styles.scheduleBottom}>
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: tint,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: tone,
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.statusPillText,
                          { color: tone },
                        ]}
                      >
                        {t(
                          `carDetails.status.${result.status}`,
                          {
                            defaultValue:
                              result.label,
                          },
                        )}
                      </Text>
                    </View>

                    <Text
                      style={styles.nextDue}
                      numberOfLines={1}
                    >
                      {schedule.enabled
                        ? schedule.nextDueMileage != null
                          ? `${schedule.nextDueMileage.toLocaleString(
                              language.startsWith('ru')
                                ? 'ru-RU'
                                : 'en-US',
                            )} ${t('carDetails.km')}`
                          : schedule.nextDueDate
                            ? formatDate(
                                schedule.nextDueDate,
                                language,
                              )
                            : t(
                                'carDetails.noDueDate',
                              )
                        : t(
                            'carDetails.paused',
                          )}
                    </Text>
                  </View>
                </Pressable>
              );
            },
          )
        )}

        {/* SERVICE HISTORY HEADER */}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>
              {t('carDetails.yourRecords')}
            </Text>

            <Text style={styles.sectionTitle}>
              {t('carDetails.serviceHistory')}
            </Text>
          </View>

          <Pressable
            style={styles.smallAdd}
            onPress={openNewService}
          >
            <Ionicons
              name="add"
              size={18}
              color={COLORS.navy}
            />

            <Text style={styles.smallAddText}>
              {t('carDetails.add')}
            </Text>
          </Pressable>
        </View>

        {/* TOTAL SPENDING */}

        {moneySummary ? (
          <View style={styles.spendingCard}>
            <View style={styles.spendingIcon}>
              <Ionicons
                name="wallet-outline"
                size={22}
                color={COLORS.navy}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.spendingCaption}>
                {t(
                  'carDetails.totalSpending',
                )}
              </Text>

              <Text
                style={styles.spendingAmount}
                numberOfLines={2}
              >
                {moneySummary}
              </Text>
            </View>
          </View>
        ) : null}

        {/* SERVICE HISTORY */}

        {isLoadingServices ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator
              color={COLORS.blue}
            />
          </View>
        ) : isServicesError ? (
          <Pressable
            style={styles.emptyCard}
            onPress={() =>
              void refetchServices()
            }
          >
            <Text style={styles.emptyText}>
              {t(
                'carDetails.servicesError',
              )}
            </Text>
          </Pressable>
        ) : sortedServices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {t(
                'carDetails.timelineEmpty',
              )}
            </Text>

            <Text style={styles.emptyText}>
              {t(
                'carDetails.timelineDescription',
              )}
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {sortedServices.map(
              (service, index) => (
                <View
                  key={service.id}
                  style={
                    styles.timelineRow
                  }
                >
                  <View style={styles.timelineRail}>
                    <View
                      style={[
                        styles.timelineDot,
                        index === 0 &&
                          styles.timelineDotActive,
                      ]}
                    />

                    {index !==
                      sortedServices.length - 1 && (
                      <View
                        style={
                          styles.timelineLine
                        }
                      />
                    )}
                  </View>

                  <Pressable
                    style={styles.historyCard}
                    onPress={() =>
                      openService(
                        service.id,
                      )
                    }
                  >
                    <View style={styles.historyTop}>
                      <Text style={styles.historyDate}>
                        {formatDate(
                          service.date,
                          language,
                        )}
                      </Text>

                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color={COLORS.muted}
                      />
                    </View>

                    <Text style={styles.historyTitle}>
                      {service.title}
                    </Text>

                    {service.workshop ? (
                      <Text
                        style={
                          styles.historyWorkshop
                        }
                        numberOfLines={1}
                      >
                        {service.workshop}
                      </Text>
                    ) : null}

                    <View style={styles.historyFooter}>
                      <View style={styles.historyMileage}>
                        <Ionicons
                          name="speedometer-outline"
                          size={15}
                          color={COLORS.blue}
                        />

                        <Text style={styles.historyMileageText}>
                          {service.mileage.toLocaleString(
                            language.startsWith('ru')
                              ? 'ru-RU'
                              : 'en-US',
                          )}{' '}
                          {t(
                            'carDetails.km',
                          )}
                        </Text>
                      </View>

                      {service.cost != null ? (
                        <Text style={styles.historyCost}>
                          {formatCost(
                            service.cost,
                            language,
                          )}{' '}
                          {service.currency ?? ''}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                </View>
              ),
            )}
          </View>
        )}

        {/* VEHICLE DETAILS */}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>
              {t('carDetails.aboutCar')}
            </Text>

            <Text style={styles.sectionTitle}>
              {t(
                'carDetails.vehicleDetails',
              )}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Pressable
            style={styles.detailsToggle}
            onPress={() =>
              setShowVehicleInfo(
                (prev) => !prev,
              )
            }
          >
            <View style={styles.detailsToggleLeft}>
              <Ionicons
                name="document-text-outline"
                size={21}
                color={COLORS.blue}
              />

              <Text style={styles.detailsToggleText}>
                {t(
                  'carDetails.specifications',
                )}
              </Text>
            </View>

            <Ionicons
              name={
                showVehicleInfo
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={20}
              color={COLORS.muted}
            />
          </Pressable>

          {showVehicleInfo && (
            <View style={styles.detailsBody}>
              <InfoRow
                label={t('carDetails.make')}
                value={car.make}
              />

              <InfoRow
                label={t('carDetails.model')}
                value={car.model}
              />

              <InfoRow
                label={t('carDetails.year')}
                value={String(car.year)}
              />

              <InfoRow
                label={t('carDetails.engine')}
                value={
                  car.engine ||
                  t(
                    'carDetails.notSpecified',
                  )
                }
              />

              <InfoRow
                label="VIN"
                value={
                  car.vin ||
                  t(
                    'carDetails.notSpecified',
                  )
                }
              />

              <InfoRow
                label={t(
                  'carDetails.licensePlate',
                )}
                value={
                  car.licensePlate ||
                  t(
                    'carDetails.notSpecified',
                  )
                }
                isLast
              />
            </View>
          )}
        </View>

        {/* DELETE VEHICLE */}

        <Pressable
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={
            deleteCar.isPending
          }
        >
          <Ionicons
            name="trash-outline"
            size={17}
            color={COLORS.red}
          />

          <Text style={styles.deleteText}>
            {deleteCar.isPending
              ? t(
                  'carDetails.deleting',
                )
              : t(
                  'carDetails.deleteVehicle',
                )}
          </Text>
        </Pressable>
      </ScrollView>

      {/* BOTTOM ACTION BAR */}

      <View style={styles.bottomBar}>
        <Pressable
          style={
            styles.addServiceButton
          }
          onPress={openNewService}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color={COLORS.navy}
          />

          <Text style={styles.addServiceText}>
            {t(
              'carDetails.addServiceRecord',
            )}
          </Text>

          <Ionicons
            name="arrow-forward"
            size={19}
            color={COLORS.navy}
          />
        </Pressable>
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        isLast && {
          borderBottomWidth: 0,
        },
      ]}
    >
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text
        style={styles.infoValue}
        selectable
      >
        {value}
      </Text>
    </View>
  );
}

function StatusCount({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statusCount}>
      <Text
        style={[
          styles.statusCountValue,
          { color },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.statusCountLabel}>
        {label}
      </Text>
    </View>
  );
}

const photoStyles = StyleSheet.create({
  cameraButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },

  vehicleTitlePanel: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: 'rgba(9, 39, 71, 0.78)',
    borderRadius: 18,
    paddingHorizontal: 17,
    paddingVertical: 13,
    marginTop: 16,
  },

  vehicleTitle: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    lineHeight: 33,
  },

  vehicleSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D8EBFA',
    marginTop: 5,
  },
});
