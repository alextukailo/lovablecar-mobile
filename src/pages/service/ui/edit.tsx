
import { COLORS, styles } from '@/pages/service/ui/edit.styles';
import { Ionicons } from '@expo/vector-icons';
import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';

import { api } from '@/../lib/api';
import ServiceForm from '@/features/services/ui/ServiceForm';

import {
    createEmptyServiceFormValues,
    type ServiceFormValues,
} from '@/features/services/model/service.schema';

import ServiceScheduleEditor, {
    type ScheduleUpdate,
    type ServiceSchedule,
} from '@/features/maintenance/ui/ServiceScheduleEditor';

type Service = {
  id: string;
  carId: string;
  title: string;
  date: string;
  mileage: number;
  description?: string | null;
  cost?: string | number | null;
  currency: string;
  workshop?: string | null;
  maintenanceSchedule?: ServiceSchedule | null;
};

function getParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error
  ) {
    const response = (
      error as {
        response?: {
          status?: number;
          data?: { message?: string | string[] };
        };
      }
    ).response;

    const message = response?.data?.message;
    if (Array.isArray(message)) return message.join('\n');
    if (typeof message === 'string') return message;
    if (response?.status) return `HTTP ${response.status}`;
  }
  return error instanceof Error ? error.message : 'Unknown error';
}

function formValues(service: Service): ServiceFormValues {
  const empty = createEmptyServiceFormValues();
  return {
    ...empty,
    date: service.date.slice(0, 10),
    mileage: String(service.mileage),
    serviceName: service.title,
    totalCost: service.cost == null ? '' : String(service.cost),
    currency:
      (service.currency as ServiceFormValues['currency']) ||
      empty.currency,
    workshop: service.workshop ?? '',
  };
}

function validateSchedule(changes: ScheduleUpdate): void {
  if (!changes.enabled) return;

  const {
    intervalKm,
    intervalMonths,
    nextDueDate,
    warningKm,
    warningDays,
  } = changes;

  const validInterval = (value: number | null) =>
    value === null ||
    (Number.isSafeInteger(value) && value > 0);

  if (
    !validInterval(intervalKm) ||
    !validInterval(intervalMonths) ||
    (intervalKm === null &&
      intervalMonths === null &&
      !nextDueDate) ||
    (intervalKm !== null && intervalKm > 1_000_000) ||
    (intervalMonths !== null && intervalMonths > 600)
  ) {
    throw new Error(
      'Enter at least one valid maintenance interval.',
    );
  }

  if (
    !Number.isSafeInteger(warningKm) ||
    warningKm < 0 ||
    warningKm > 100_000 ||
    !Number.isSafeInteger(warningDays) ||
    warningDays < 0 ||
    warningDays > 365
  ) {
    throw new Error('Enter valid maintenance warning values.');
  }
}

export default function EditServiceScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    serviceId?: string | string[];
    carId?: string | string[];
    vehicleId?: string | string[];
  }>();

  const serviceId =
    getParam(params.id) ?? getParam(params.serviceId);
  const routeCarId =
    getParam(params.carId) ?? getParam(params.vehicleId);

  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const ru = i18n.resolvedLanguage?.startsWith('ru') ?? false;
  const tr = (en: string, russian: string) => ru ? russian : en;

  const [scheduleChanges, setScheduleChanges] =
    useState<ScheduleUpdate | null>(null);

  const serviceQuery = useQuery({
    queryKey: ['service', 'edit', routeCarId, serviceId],
    enabled: Boolean(serviceId),
    queryFn: async (): Promise<Service> => {
      if (!serviceId) throw new Error('Missing service ID');

      if (routeCarId) {
        const response = await api.get<Service>(
          `/cars/${encodeURIComponent(routeCarId)}/services/${encodeURIComponent(serviceId)}`,
        );
        return response.data;
      }

      const response = await api.get<Service>(
        `/service/${encodeURIComponent(serviceId)}`,
      );
      return response.data;
    },
  });

  const service = serviceQuery.data;
  const carId = service?.carId ?? routeCarId;

  const updateMutation = useMutation({
    mutationFn: async (values: ServiceFormValues) => {
      if (!carId || !serviceId) {
        throw new Error('Missing car or service ID');
      }
      if (!scheduleChanges) {
        throw new Error('Maintenance schedule state is not ready');
      }

      validateSchedule(scheduleChanges);

      const payload = {
        date: values.date,
        mileage: Number(values.mileage),
        title: values.serviceName.trim(),
        cost: values.totalCost.replace(',', '.'),
        currency: values.currency,
        workshop: values.workshop.trim(),
        maintenanceSchedule: {
          enabled: scheduleChanges.enabled,
          intervalKm: scheduleChanges.intervalKm,
          intervalMonths: scheduleChanges.intervalMonths,
          nextDueDate: scheduleChanges.nextDueDate,
          warningKm: scheduleChanges.warningKm,
          warningDays: scheduleChanges.warningDays,
        },
      };

      console.log(
        '[EditService] Saving:',
        JSON.stringify(payload, null, 2),
      );

      const response = await api.patch<Service>(
        `/cars/${encodeURIComponent(carId)}/services/${encodeURIComponent(serviceId)}`,
        payload,
      );

      return response.data;
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['service'] }),
        queryClient.invalidateQueries({ queryKey: ['services'] }),
        queryClient.invalidateQueries({ queryKey: ['cars'] }),
        queryClient.invalidateQueries({ queryKey: ['car'] }),
        queryClient.invalidateQueries({ queryKey: ['maintenance'] }),
      ]);
      router.back();
    },

    onError: (error) => {
      Alert.alert(
        tr(
          'Unable to save changes',
          'Не удалось сохранить изменения',
        ),
        getErrorMessage(error),
      );
    },
  });

  if (!serviceId) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={44}
          color={COLORS.blue}
        />
        <Text style={styles.errorTitle}>
          {tr(
            'Service information is missing',
            'Отсутствуют данные обслуживания',
          )}
        </Text>
        <Pressable
          style={styles.errorButton}
          onPress={() => router.back()}
        >
          <Text style={styles.errorButtonText}>
            {tr('Go back', 'Назад')}
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
          color={COLORS.navy}
        />
        <Text style={styles.loadingText}>
          {tr(
            'Loading service...',
            'Загрузка обслуживания...',
          )}
        </Text>
      </View>
    );
  }

  if (serviceQuery.isError || !service || !carId) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="cloud-offline-outline"
          size={48}
          color={COLORS.blue}
        />
        <Text style={styles.errorTitle}>
          {tr(
            'Unable to load service',
            'Не удалось загрузить обслуживание',
          )}
        </Text>
        <Text style={styles.errorDescription}>
          {serviceQuery.error
            ? getErrorMessage(serviceQuery.error)
            : tr(
                'Service was not found.',
                'Обслуживание не найдено.',
              )}
        </Text>
        <Pressable
          style={styles.errorButton}
          onPress={() => void serviceQuery.refetch()}
        >
          <Ionicons
            name="refresh-outline"
            size={18}
            color={COLORS.navy}
          />
          <Text style={styles.errorButtonText}>
            {tr('Try again', 'Повторить')}
          </Text>
        </Pressable>
        <Pressable
          style={styles.goBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.goBackText}>
            {tr('Go back', 'Назад')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.back}
            hitSlop={10}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={COLORS.navy}
            />
          </Pressable>
          <Text style={styles.headerTitle}>
            {tr('Edit Service', 'Редактировать ТО')}
          </Text>
          <View style={styles.back} />
        </View>

        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons
              name="construct-outline"
              size={23}
              color={COLORS.navy}
            />
          </View>
          <View style={styles.introText}>
            <Text
              style={styles.introTitle}
              numberOfLines={2}
            >
              {service.title}
            </Text>
            <Text style={styles.introSubtitle}>
              {tr(
                'Update service information and maintenance schedule',
                'Изменение обслуживания и графика ТО',
              )}
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <ServiceForm
            key={service.id}
            showOwnService
            defaultValues={formValues(service)}
            submitLabel={
              updateMutation.isPending
                ? tr('Saving...', 'Сохранение...')
                : tr('Save Changes', 'Сохранить изменения')
            }
            beforeSubmit={
              <ServiceScheduleEditor
                schedule={service.maintenanceSchedule}
                onChange={setScheduleChanges}
              />
            }
            onSubmit={async (values) => {
              await updateMutation.mutateAsync(values);
            }}
          />
        </View>

        <Text style={styles.footer}>
          {tr(
            'Your changes will be saved to the service history and its linked maintenance schedule.',
            'Изменения будут сохранены в истории обслуживания и связанном графике ТО.',
          )}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
