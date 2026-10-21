import axios from 'axios';

import { Ionicons } from '@expo/vector-icons';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import {
    router,
    useLocalSearchParams,
} from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    Linking,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { api } from '@/../lib/api';
import { useCar } from '@/features/cars/model/useCars';

type ServiceAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

type SelectedAttachment = {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
};

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

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


type AttachmentTileProps = {
  item: ServiceAttachment;
  carId: string;
  serviceId: string;
  busy: boolean;
  onOpen: () => void;
  onDelete: () => void;
};

function AttachmentTile({ item, carId, serviceId, busy, onOpen, onDelete }: AttachmentTileProps) {
  const isImage = item.mimeType.startsWith('image/');
  const preview = useQuery({
    queryKey: ['attachment-url', carId, serviceId, item.id],
    enabled: isImage,
    staleTime: 3 * 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get<{ url: string }>(
        `/cars/${carId}/services/${serviceId}/attachments/${item.id}/url`,
      );
      return data.url;
    },
  });

  return (
    <Pressable
      style={styles.documentItem}
      disabled={busy}
      onPress={onOpen}
      onLongPress={onDelete}
      delayLongPress={500}
    >
      <View style={[styles.documentTile, styles.previewTile]}>
        {busy ? (
          <ActivityIndicator color={COLORS.blue} />
        ) : isImage && preview.data ? (
          <Image
            source={{ uri: preview.data }}
            style={styles.attachmentThumbnail}
            resizeMode="cover"
          />
        ) : preview.isLoading && isImage ? (
          <ActivityIndicator color={COLORS.blue} />
        ) : (
          <Ionicons
            name={isImage ? 'image-outline' : 'document-text-outline'}
            size={32}
            color={COLORS.blue}
          />
        )}
      </View>
      <Text numberOfLines={2} style={styles.attachmentName}>{item.fileName}</Text>
    </Pressable>
  );
}

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
  const [uploading, setUploading] = useState(false);
  const [attachmentBusyId, setAttachmentBusyId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<ServiceAttachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);


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

  const attachmentsQuery = useQuery({
    queryKey: ['service-attachments', routeCarId || serviceQuery.data?.carId, serviceId],
    enabled: Boolean(serviceId && (routeCarId || serviceQuery.data?.carId)),
    queryFn: async (): Promise<ServiceAttachment[]> => {
      const id = routeCarId || serviceQuery.data?.carId;
      const { data } = await api.get<ServiceAttachment[]>(
        `/cars/${id}/services/${serviceId}/attachments`,
      );
      return data;
    },
  });

  // Resolve carId from the loaded service when
  // it was not included in route parameters.
  const carId =
    service?.carId ??
    routeCarId;

  const carQuery = useCar(carId);

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

  const uploadAttachment = async (file: SelectedAttachment) => {
    if (!carId || !serviceId || uploading) return;
    if (!ACCEPTED_TYPES.includes(file.mimeType) || !Number.isInteger(file.size) ||
        file.size <= 0 || file.size > MAX_ATTACHMENT_BYTES) {
      Alert.alert(tr('Invalid file', 'Недопустимый файл'),
        tr('Choose a JPG, PNG, WebP, HEIC, HEIF or PDF under 10 MB.',
          'Выберите JPG, PNG, WebP, HEIC, HEIF или PDF размером до 10 МБ.'));
      return;
    }
    setUploading(true);
    let uploadStage: 'prepare' | 'storage' | 'confirm' = 'prepare';
    try {
      const base = `/cars/${carId}/services/${serviceId}/attachments`;
      const payload = { fileName: file.name, mimeType: file.mimeType, size: file.size };
      const { data: prepared } = await api.post<{ signedUrl: string; storageKey: string }>(
        `${base}/upload-url`, payload,
      );
      // Signed URL is issued by the backend. Never send the backend secret to the app.
      uploadStage = 'storage';
      const info = await FileSystem.getInfoAsync(file.uri);
      if (!info.exists || info.isDirectory || typeof info.size !== 'number') {
        throw new Error('Cannot read selected file');
      }
      if (info.size !== file.size) {
        throw new Error(`Local file size mismatch: expected ${file.size}, actual ${info.size}`);
      }
      const result = await FileSystem.uploadAsync(prepared.signedUrl, file.uri, {
        httpMethod: 'PUT',
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        headers: { 'Content-Type': file.mimeType },
      });
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Storage upload failed (${result.status}): ${result.body.slice(0, 300)}`);
      }
      uploadStage = 'confirm';
      await api.post(base, { ...payload, storageKey: prepared.storageKey });
      await queryClient.invalidateQueries({ queryKey: ['service-attachments', carId, serviceId] });
    } catch (error) {
      let message = tr('Please try again.', 'Попробуйте ещё раз.');
      if (axios.isAxiosError(error)) {
        const response = error.response?.data;
        const serverMessage = response?.message ?? response?.error;
        message = Array.isArray(serverMessage)
          ? serverMessage.join(', ')
          : typeof serverMessage === 'string'
            ? serverMessage
            : error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      console.error('Attachment upload failed', { stage: uploadStage, message });
      Alert.alert(tr('Upload failed', 'Ошибка загрузки'), `${uploadStage}: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  const chooseDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const info = await FileSystem.getInfoAsync(file.uri);
      if (!info.exists || info.isDirectory || typeof info.size !== 'number') {
        throw new Error('Cannot read selected document');
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      const mimeType = ext === 'heic' ? 'image/heic' : ext === 'heif' ? 'image/heif'
        : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png'
        : ext === 'webp' ? 'image/webp' : ext === 'pdf' ? 'application/pdf'
        : file.mimeType || 'application/octet-stream';
      await uploadAttachment({
        uri: file.uri, name: file.name,
        mimeType,
        size: info.size,
      });
    } catch {
      Alert.alert(tr('Unable to select file', 'Не удалось выбрать файл'));
    }
  };

  const choosePhoto = async (camera: boolean) => {
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(tr('Camera access required', 'Необходим доступ к камере'));
          return;
        }
      }

      const result = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1,
            allowsEditing: false,
          });

      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];
      const rawName = asset.fileName ?? '';
      const extension = rawName.split('.').pop()?.toLowerCase();
      const mimeType = extension === 'heic'
        ? 'image/heic'
        : extension === 'heif'
          ? 'image/heif'
          : asset.mimeType || 'image/jpeg';
      const suffix = mimeType === 'image/heic' ? 'heic'
        : mimeType === 'image/heif' ? 'heif'
          : mimeType === 'image/png' ? 'png'
            : mimeType === 'image/webp' ? 'webp' : 'jpg';
      const name = rawName || `service-photo-${Date.now()}.${suffix}`;
      const info = await FileSystem.getInfoAsync(asset.uri);
      if (!info.exists || info.isDirectory || typeof info.size !== 'number') {
        throw new Error('Cannot read selected photo');
      }

      await uploadAttachment({
        uri: asset.uri,
        name,
        mimeType,
        size: info.size,
      });
    } catch (error) {
      console.error('Photo selection failed:', error);
      Alert.alert(tr('Unable to select photo', 'Не удалось выбрать фото'),
        error instanceof Error ? error.message : undefined);
    }
  };

  const showAddOptions = () => {
    Alert.alert(tr('Add attachment', 'Добавить вложение'), undefined, [
      { text: tr('Camera', 'Камера'), onPress: () => void choosePhoto(true) },
      { text: tr('Photo library', 'Галерея'), onPress: () => void choosePhoto(false) },
      { text: tr('Files / PDF', 'Файлы / PDF'), onPress: () => void chooseDocument() },
      { text: tr('Cancel', 'Отмена'), style: 'cancel' },
    ]);
  };

  const openAttachment = async (item: ServiceAttachment) => {
    if (!carId || !serviceId) return;
    setPreviewAttachment(item);
    setPreviewUrl(null);
    setPreviewLoading(true);
    try {
      const { data } = await api.get<{ url: string }>(
        `/cars/${carId}/services/${serviceId}/attachments/${item.id}/url`,
      );
      setPreviewUrl(data.url);
    } catch {
      setPreviewAttachment(null);
      Alert.alert(tr('Cannot open attachment', 'Не удалось открыть вложение'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const deleteAttachment = (item: ServiceAttachment) => {
    if (!carId || !serviceId) return;
    Alert.alert(tr('Delete attachment?', 'Удалить вложение?'), item.fileName, [
      { text: tr('Cancel', 'Отмена'), style: 'cancel' },
      { text: tr('Delete', 'Удалить'), style: 'destructive', onPress: async () => {
        setAttachmentBusyId(item.id);
        try {
          await api.delete(`/cars/${carId}/services/${serviceId}/attachments/${item.id}`);
          await queryClient.invalidateQueries({ queryKey: ['service-attachments', carId, serviceId] });
        } catch {
          Alert.alert(tr('Could not delete attachment', 'Не удалось удалить вложение'));
        } finally { setAttachmentBusyId(null); }
      } },
    ]);
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
          {(attachmentsQuery.data ?? []).map((item) => (
            carId && serviceId ? (
              <AttachmentTile
                key={item.id}
                item={item}
                carId={carId}
                serviceId={serviceId}
                busy={attachmentBusyId === item.id}
                onOpen={() => void openAttachment(item)}
                onDelete={() => deleteAttachment(item)}
              />
            ) : null
          ))}
          <Pressable style={styles.documentItem} onPress={showAddOptions} disabled={uploading}>
            <View style={styles.documentTile}>
              {uploading ? <ActivityIndicator color={COLORS.blue} /> : (
                <Ionicons name="add" size={32} color={COLORS.blue} />
              )}
            </View>
            <Text style={styles.attachmentName}>{tr('Add file', 'Добавить')}</Text>
          </Pressable>
        </View>
        {attachmentsQuery.isLoading && <ActivityIndicator color={COLORS.blue} />}
        {attachmentsQuery.isError && (
          <Pressable onPress={() => void attachmentsQuery.refetch()}>
            <Text style={styles.helper}>{tr('Could not load attachments · Tap to retry', 'Не удалось загрузить вложения · Повторить')}</Text>
          </Pressable>
        )}
        <Text style={styles.helper}>
          {uploading
            ? tr('Uploading attachment...', 'Загрузка вложения...')
            : tr('JPG, PNG, WebP, HEIC, HEIF or PDF · max 10 MB. Tap to preview; hold to delete.',
                 'JPG, PNG, WebP, HEIC, HEIF или PDF · до 10 МБ. Нажмите для просмотра; удерживайте для удаления.')}
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
      <Modal
        visible={previewAttachment !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewAttachment(null)}
      >
        <View style={styles.previewOverlay}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle} numberOfLines={1}>
              {previewAttachment?.fileName ?? ''}
            </Text>
            <Pressable
              onPress={() => setPreviewAttachment(null)}
              style={styles.previewClose}
              accessibilityLabel={tr('Close preview', 'Закрыть просмотр')}
            >
              <Ionicons name="close" size={28} color={COLORS.white} />
            </Pressable>
          </View>
          <View style={styles.previewContent}>
            {previewLoading ? (
              <ActivityIndicator size="large" color={COLORS.white} />
            ) : previewUrl && previewAttachment?.mimeType.startsWith('image/') ? (
              <Image
                source={{ uri: previewUrl }}
                style={styles.fullPreviewImage}
                resizeMode="contain"
              />
            ) : previewUrl ? (
              <View style={styles.pdfPreview}>
                <Ionicons name="document-text-outline" size={64} color={COLORS.white} />
                <Text style={styles.pdfPreviewName}>{previewAttachment?.fileName}</Text>
                <Pressable
                  style={styles.pdfOpenButton}
                  onPress={() => void Linking.openURL(previewUrl)}
                >
                  <Text style={styles.pdfOpenText}>
                    {tr('Open PDF', 'Открыть PDF')}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
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
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 15,
  },

  documentItem: { width: 88, alignItems: 'center' },
  attachmentName: { fontSize: 10, color: COLORS.navy, textAlign: 'center', marginTop: 5 },
  previewTile: { overflow: 'hidden' },
  attachmentThumbnail: { width: '100%', height: '100%' },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(7, 17, 32, 0.97)', paddingTop: 58 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 16 },
  previewTitle: { flex: 1, color: COLORS.white, fontSize: 15, fontWeight: '600' },
  previewClose: { padding: 8 },
  previewContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullPreviewImage: { width: '100%', height: '100%' },
  pdfPreview: { alignItems: 'center', padding: 24, gap: 20 },
  pdfPreviewName: { color: COLORS.white, fontSize: 16, textAlign: 'center' },
  pdfOpenButton: { backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  pdfOpenText: { color: COLORS.navy, fontWeight: '700' },

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
