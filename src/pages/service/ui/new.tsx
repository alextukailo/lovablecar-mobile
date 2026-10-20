
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
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
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

import { api } from '@/../lib/api';
import {
    useCar,
    useCars,
} from '@/features/cars/model/useCars';
import ServiceForm from '@/features/services/ui/ServiceForm';
import {
    createEmptyServiceFormValues,
    type ServiceFormValues,
} from '@/features/services/model/service.schema';
import { useCarStore } from '@/entities/car/model/car.store';

interface MaintenanceSchedulePayload {
  enabled: boolean;
  intervalKm?: number;
  intervalMonths?: number;
  warningKm?: number;
  warningDays?: number;
}

interface CreateServicePayload {
  date: string;
  mileage: number;
  title: string;
  cost: string;
  currency: string;
  workshop?: string;
  maintenanceSchedule?: MaintenanceSchedulePayload;
}

interface CreatedService {
  id: string;
  carId: string;
  title: string;
}

function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | {
          message?: string | string[];
          error?: string;
        }
      | undefined;

    const message = Array.isArray(data?.message)
      ? data.message.join('\n')
      : data?.message || data?.error;

    if (status) {
      return `HTTP ${status}\n${message || error.message}`;
    }

    if (error.code === 'ECONNABORTED') {
      return 'The server did not respond in time.';
    }

    return error.message || 'Network request failed.';
  }

  return error instanceof Error
    ? error.message
    : 'An unexpected error occurred.';
}

function parsePositiveInteger(
  value: string,
): number | undefined {
  const trimmed = value.trim();

  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return undefined;
  }

  const number = Number(trimmed);

  return Number.isSafeInteger(number) && number > 0
    ? number
    : undefined;
}

function parseNonNegativeInteger(
  value: string,
): number | undefined {
  const trimmed = value.trim();

  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }

  const number = Number(trimmed);

  return Number.isSafeInteger(number) && number >= 0
    ? number
    : undefined;
}

function ScheduleField({
  label,
  value,
  onChangeText,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor="#A3A3A3"
        />

        <Text style={styles.inputSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

export default function ServiceNewScreen() {
  const { i18n } = useTranslation();

  const ru =
    i18n.resolvedLanguage?.startsWith('ru') ?? false;

  const label = (en: string, russian: string) =>
    ru ? russian : en;

  const params = useLocalSearchParams<{
    vehicleId?: string | string[];
    carId?: string | string[];
  }>();

  const queryClient = useQueryClient();

  const [isChoosingDocument, setIsChoosingDocument] =
    useState(false);

  const [scheduleEnabled, setScheduleEnabled] =
    useState(false);

  const [intervalKm, setIntervalKm] =
    useState('10000');

  const [intervalMonths, setIntervalMonths] =
    useState('12');

  const [warningKm, setWarningKm] =
    useState('500');

  const [warningDays, setWarningDays] =
    useState('7');

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const storedSelectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  const routeId = params.vehicleId ?? params.carId;

  const routeCarId = Array.isArray(routeId)
    ? routeId[0]
    : routeId;

  const {
    data: cars = [],
    isLoading: isLoadingCars,
    isError: isCarsError,
    refetch: refetchCars,
  } = useCars();

  const routeCar = cars.find(
    (item) => item.id === routeCarId,
  );

  const selectedCar = cars.find(
    (item) => item.id === storedSelectedCarId,
  );

  const primaryCar = cars.find(
    (item) => item.isPrimary,
  );

  const resolvedCar =
    routeCar ??
    selectedCar ??
    primaryCar ??
    cars[0] ??
    null;

  const vehicleId = resolvedCar?.id;

  const {
    data: car,
    isLoading: isLoadingCar,
    isError: isCarError,
    refetch: refetchCar,
  } = useCar(vehicleId);

  const createService = useMutation({
    mutationFn: async ({
      carId,
      payload,
    }: {
      carId: string;
      payload: CreateServicePayload;
    }): Promise<CreatedService> => {
      console.log('[Service] Creating service', {
        carId,
        title: payload.title,
        mileage: payload.mileage,
        maintenanceEnabled:
          payload.maintenanceSchedule?.enabled ?? false,
      });

      const response = await api.post<CreatedService>(
        `/cars/${carId}/services`,
        payload,
      );

      console.log('[Service] POST response', {
        status: response.status,
        data: response.data,
      });

      if (
        !response.data ||
        typeof response.data.id !== 'string' ||
        !response.data.id
      ) {
        throw new Error(
          'The server responded without a service ID. Please check your service history before trying again.',
        );
      }

      return response.data;
    },

    onSuccess: async (_created, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            'cars',
            variables.carId,
            'services',
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ['services'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['maintenance'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['cars'],
        }),
      ]);
    },
  });

  const buildSchedule = ():
    | MaintenanceSchedulePayload
    | undefined => {
    if (!scheduleEnabled) {
      return undefined;
    }

    const km = parsePositiveInteger(intervalKm);
    const months = parsePositiveInteger(intervalMonths);

    const warnKm = parseNonNegativeInteger(warningKm);
    const warnDays = parseNonNegativeInteger(warningDays);

    const invalid =
      (intervalKm.trim() !== '' && km === undefined) ||
      (intervalMonths.trim() !== '' && months === undefined) ||
      (km === undefined && months === undefined) ||
      (km !== undefined && km > 1_000_000) ||
      (months !== undefined && months > 600) ||
      warnKm === undefined ||
      warnKm > 100_000 ||
      warnDays === undefined ||
      warnDays > 365;

    if (invalid) {
      Alert.alert(
        label('Invalid schedule', 'Неверный график'),
        label(
          'Enter at least one valid interval and check the warning values.',
          'Укажите хотя бы один интервал и проверьте значения предупреждений.',
        ),
      );

      return undefined;
    }

    return {
      enabled: true,
      intervalKm: km,
      intervalMonths: months,
      warningKm: warnKm,
      warningDays: warnDays,
    };
  };

  const handleCreate = async (
    values: ServiceFormValues,
  ) => {
    if (createService.isPending) {
      return;
    }

    setSaveError(null);

    if (!car || !vehicleId) {
      Alert.alert(
        label('Car not found', 'Автомобиль не найден'),
      );
      return;
    }

    const mileage = Number(values.mileage);

    const cost = Number(
      values.totalCost.trim().replace(',', '.'),
    );

    if (
      !Number.isSafeInteger(mileage) ||
      mileage < 0 ||
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      Alert.alert(
        label('Invalid details', 'Неверные данные'),
        label(
          'Check the mileage and service cost.',
          'Проверьте пробег и стоимость.',
        ),
      );
      return;
    }

    const title = values.serviceName.trim();

    if (!title) {
      Alert.alert(
        label('Service name required', 'Введите название'),
      );
      return;
    }

    const date = new Date(
      `${values.date}T12:00:00`,
    );

    if (Number.isNaN(date.getTime())) {
      Alert.alert(
        label('Invalid date', 'Неверная дата'),
      );
      return;
    }

    const maintenanceSchedule = buildSchedule();

    if (scheduleEnabled && !maintenanceSchedule) {
      return;
    }

    const payload: CreateServicePayload = {
      date: date.toISOString(),
      mileage,
      title,
      cost: cost.toFixed(2),
      currency: values.currency,
      workshop: values.workshop.trim() || undefined,
      ...(maintenanceSchedule
        ? { maintenanceSchedule }
        : {}),
    };

    try {
    const created = await createService.mutateAsync({
        carId: vehicleId,
        payload,
      });

      router.replace({
        pathname: '/service/[id]',
        params: {
          id: created.id,
          carId: vehicleId,
        },
      });

      console.log(
        '[Service] Successfully created:',
        created.id,
      );

      selectCar(vehicleId);

      router.replace({
        pathname: '/service/[id]',
        params: {
          id: created.id,
          carId: vehicleId,
        },
      });
    } catch (error) {
      const message = getApiError(error);

      console.error(
        '[Service] Save failed:',
        message,
        error,
      );

      setSaveError(message);

      Alert.alert(
        label(
          'Unable to save service',
          'Не удалось сохранить обслуживание',
        ),
        message,
      );
    }
  };

  const handleChooseDocument = async () => {
    if (isChoosingDocument || !vehicleId) {
      return;
    }

    setIsChoosingDocument(true);

    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 1,
        });

      if (
        result.canceled ||
        !result.assets[0]?.uri
      ) {
        return;
      }

      selectCar(vehicleId);

      router.push({
        pathname: '/scanner/processing',
        params: {
          uri: result.assets[0].uri,
          vehicleId,
        },
      });
    } catch (error) {
      Alert.alert(
        label(
          'Unable to open photos',
          'Не удалось открыть галерею',
        ),
        getApiError(error),
      );
    } finally {
      setIsChoosingDocument(false);
    }
  };

  const handleScanDocument = () => {
    if (!vehicleId) return;

    selectCar(vehicleId);

    router.push({
      pathname: '/scanner',
      params: { vehicleId },
    });
  };

  if (isLoadingCars || (vehicleId && isLoadingCar)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#F5C400" />

        <Text style={styles.helperText}>
          {label(
            'Loading your car...',
            'Загрузка автомобиля...',
          )}
        </Text>
      </View>
    );
  }

  if (isCarsError || isCarError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.heading}>
          {label(
            'Unable to load car',
            'Не удалось загрузить автомобиль',
          )}
        </Text>

        <Pressable
          style={styles.actionButton}
          onPress={() => {
            void refetchCars();

            if (vehicleId) {
              void refetchCar();
            }
          }}
        >
          <Text style={styles.actionButtonText}>
            {label('Try again', 'Повторить')}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!car || !vehicleId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.heading}>
          {label(
            'No car selected',
            'Автомобиль не выбран',
          )}
        </Text>

        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/car/new')}
        >
          <Text style={styles.actionButtonText}>
            {label('Add car', 'Добавить автомобиль')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios' ? 'padding' : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.carCard}>
          <Text style={styles.carLabel}>
            {label(
              'SERVICE FOR',
              'ОБСЛУЖИВАНИЕ АВТОМОБИЛЯ',
            )}
          </Text>

          <Text style={styles.carName}>
            {car.make} {car.model}
          </Text>

          <Text style={styles.carDetails}>
            {car.year}
            {car.engine ? ` · ${car.engine}` : ''}
            {' · '}
            {car.mileage.toLocaleString()} km
          </Text>
        </View>

        <Text style={styles.heading}>
          {label(
            'Add service record',
            'Добавить обслуживание',
          )}
        </Text>

        <Text style={styles.description}>
          {label(
            'Record completed maintenance and schedule the next service.',
            'Запишите выполненное обслуживание и запланируйте следующее.',
          )}
        </Text>

        <View style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleHeaderText}>
              <Text style={styles.scheduleTitle}>
                {label(
                  'Schedule next service',
                  'Запланировать следующее ТО',
                )}
              </Text>

              <Text style={styles.scheduleSubtitle}>
                {label(
                  'Remind me when this service is due again',
                  'Напомнить о повторном обслуживании',
                )}
              </Text>
            </View>

            <Switch
              value={scheduleEnabled}
              onValueChange={setScheduleEnabled}
              trackColor={{
                false: '#D4D4D4',
                true: '#F5C400',
              }}
              thumbColor="#FFFFFF"
            />
          </View>

          {scheduleEnabled && (
            <>
              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>
                {label(
                  'SERVICE INTERVAL',
                  'ИНТЕРВАЛ ОБСЛУЖИВАНИЯ',
                )}
              </Text>

              <View style={styles.fieldsRow}>
                <ScheduleField
                  label={label('Mileage', 'Пробег')}
                  value={intervalKm}
                  onChangeText={setIntervalKm}
                  suffix="km"
                />

                <ScheduleField
                  label={label('Time', 'Время')}
                  value={intervalMonths}
                  onChangeText={setIntervalMonths}
                  suffix={label('mo', 'мес')}
                />
              </View>

              <Text style={styles.hint}>
                {label(
                  'Leave one interval empty to use only mileage or time.',
                  'Оставьте одно поле пустым, чтобы использовать только пробег или время.',
                )}
              </Text>

              <Text style={styles.sectionLabel}>
                {label(
                  'REMIND ME BEFORE',
                  'НАПОМНИТЬ ЗАРАНЕЕ',
                )}
              </Text>

              <View style={styles.fieldsRow}>
                <ScheduleField
                  label={label('Distance', 'Пробег')}
                  value={warningKm}
                  onChangeText={setWarningKm}
                  suffix="km"
                />

                <ScheduleField
                  label={label('Days', 'Дней')}
                  value={warningDays}
                  onChangeText={setWarningDays}
                  suffix={label('days', 'дн')}
                />
              </View>

              <Text style={styles.hint}>
                {label(
                  'The next service will be calculated from the date and mileage you enter below.',
                  'Следующее ТО будет рассчитано по дате и пробегу, указанным ниже.',
                )}
              </Text>
            </>
          )}
        </View>

        {saveError && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>
              {label(
                'Service was not confirmed',
                'Сохранение не подтверждено',
              )}
            </Text>

            <Text style={styles.errorText}>
              {saveError}
            </Text>
          </View>
        )}

        <ServiceForm
          key={car.id}
          defaultValues={createEmptyServiceFormValues(
            String(car.mileage),
          )}
          submitLabel={
            createService.isPending
              ? label('Saving...', 'Сохранение...')
              : label(
                  'Save service',
                  'Сохранить обслуживание',
                )
          }
          onSubmit={handleCreate}
          onScanDocument={handleScanDocument}
          onChooseDocument={handleChooseDocument}
        />

        {isChoosingDocument && (
          <Text style={styles.helperText}>
            {label(
              'Opening photo library...',
              'Открытие галереи...',
            )}
          </Text>
        )}

        {createService.isPending && (
          <View style={styles.saving}>
            <ActivityIndicator color="#F5C400" />

            <Text style={styles.helperText}>
              {label(
                'Saving service to the backend...',
                'Сохранение обслуживания на сервере...',
              )}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F7F7F5',
  },
  carCard: {
    backgroundColor: '#171717',
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },
  carLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#A3A3A3',
  },
  carName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },
  carDetails: {
    fontSize: 13,
    color: '#D4D4D4',
    marginTop: 5,
  },
  heading: {
    fontSize: 25,
    fontWeight: '800',
    color: '#171717',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#737373',
    marginTop: 8,
    marginBottom: 20,
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  scheduleHeaderText: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171717',
  },
  scheduleSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: '#737373',
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginVertical: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#737373',
    marginBottom: 12,
  },
  fieldsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    minWidth: 0,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  inputContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: '#171717',
    paddingVertical: 10,
  },
  inputSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A8A8A',
    marginLeft: 5,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
    color: '#8A8A8A',
    marginTop: 10,
    marginBottom: 18,
  },
  errorCard: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#BE123C',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#9F1239',
  },
  actionButton: {
    backgroundColor: '#F5C400',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 15,
    marginTop: 20,
  },
  actionButtonText: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '800',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#737373',
    textAlign: 'center',
    marginTop: 12,
  },
  saving: {
    alignItems: 'center',
    marginTop: 16,
  },
});
