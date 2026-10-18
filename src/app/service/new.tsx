
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import {
    ArrowLeft,
    CalendarDays,
    Camera,
    CarFront,
    Check,
    ChevronDown,
    Coins,
    FileText,
    Image as ImageIcon,
    MapPin,
    Route,
    ScanLine,
} from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { api } from '../../../lib/api';
import {
    useCar,
    useCars,
} from '../../features/cars/hooks/useCars';
import {
    createEmptyServiceFormValues,
    serviceSchema,
    supportedCurrencyOptions,
    type ServiceFormValues,
} from '../../features/services/schemas/service.schema';
import { useCarStore } from '../../store/car.store';

const COLORS = {
  sky: '#DDF2FF',
  blue: '#1789E8',
  navy: '#102C4B',
  text: '#17365A',
  muted: '#607C9B',
  border: '#DCEAF5',
  white: '#FFFFFF',
  yellow: '#FFD23F',
  yellowLight: '#FFE77A',
  field: '#F8FBFF',
  danger: '#D84B4B',
};

type FormTab = 'manual' | 'scan';

interface CreateServicePayload {
  date: string;
  mileage: number;
  title: string;
  cost: string;
  currency: string;
  workshop?: string;
}

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Text style={styles.fieldLabel}>
      {children}
    </Text>
  );
}

function FieldError({
  message,
}: {
  message?: string;
}) {
  if (!message) return null;

  return (
    <Text style={styles.fieldError}>
      {message}
    </Text>
  );
}

export default function ServiceNewScreen() {
  const params = useLocalSearchParams<{
    vehicleId?: string | string[];
  }>();

  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] =
    useState<FormTab>('manual');

  const [currencyOpen, setCurrencyOpen] =
    useState(false);

  const [isChoosingDocument, setIsChoosingDocument] =
    useState(false);

  const storedSelectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  const routeVehicleId = Array.isArray(params.vehicleId)
    ? params.vehicleId[0]
    : params.vehicleId;

  const {
    data: cars = [],
    isLoading: isLoadingCars,
    isError: isCarsError,
    refetch: refetchCars,
  } = useCars();

  const routeCar = cars.find(
    (item) => item.id === routeVehicleId,
  );

  const storedCar = cars.find(
    (item) => item.id === storedSelectedCarId,
  );

  const primaryCar = cars.find(
    (item) => item.isPrimary,
  );

  const resolvedCar =
    routeCar ??
    storedCar ??
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
    }) => {
      const response = await api.post(
        `/cars/${carId}/services`,
        payload,
      );

      return response.data;
    },

    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [
          'cars',
          variables.carId,
          'services',
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: ['cars'],
      });
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    values: createEmptyServiceFormValues(
      String(car?.mileage ?? ''),
    ),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const handleCreate = async (
    values: ServiceFormValues,
  ) => {
    if (!car || !vehicleId) {
      Alert.alert(
        'Car not found',
        'Please select a car before adding a service.',
      );
      return;
    }

    const mileage = Number(values.mileage);
    const cost = Number(
      values.totalCost.replace(',', '.'),
    );

    if (
      !Number.isInteger(mileage) ||
      mileage < 0 ||
      !Number.isFinite(cost) ||
      cost < 0
    ) {
      Alert.alert(
        'Invalid details',
        'Please check the mileage and cost.',
      );
      return;
    }

    const title = values.serviceName.trim();

    if (!title) {
      Alert.alert(
        'Missing service',
        'Please enter a service description.',
      );
      return;
    }

    const parsedDate = new Date(
      `${values.date}T12:00:00`,
    );

    if (Number.isNaN(parsedDate.getTime())) {
      Alert.alert(
        'Invalid date',
        'Please enter a valid service date.',
      );
      return;
    }

    try {
      await createService.mutateAsync({
        carId: vehicleId,
        payload: {
          date: parsedDate.toISOString(),
          mileage,
          title,
          cost: cost.toFixed(2),
          currency: values.currency,
          workshop:
            values.workshop.trim() || undefined,
        },
      });

      selectCar(vehicleId);

      router.replace('/(tabs)/services');
    } catch (error) {
      console.error(
        'Failed to create service:',
        error,
      );

      Alert.alert(
        'Unable to save service',
        'Please check your connection and try again.',
      );
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
      console.error(
        'Failed to choose document:',
        error,
      );

      Alert.alert(
        'Unable to open gallery',
        'Please try again.',
      );
    } finally {
      setIsChoosingDocument(false);
    }
  };

  if (
    isLoadingCars ||
    (vehicleId && isLoadingCar)
  ) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator
          size="large"
          color={COLORS.blue}
        />
        <Text style={styles.centerText}>
          Loading your car...
        </Text>
      </View>
    );
  }

  if (isCarsError || isCarError) {
    return (
      <View style={styles.centerScreen}>
        <Text style={styles.centerTitle}>
          Unable to load car
        </Text>
        <Text style={styles.centerText}>
          Please check your connection.
        </Text>
        <Pressable
          style={styles.actionButton}
          onPress={() => {
            void refetchCars();
            if (vehicleId) void refetchCar();
          }}
        >
          <Text style={styles.actionButtonText}>
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!car || !vehicleId) {
    return (
      <View style={styles.centerScreen}>
        <CarFront
          size={48}
          color={COLORS.blue}
        />
        <Text style={styles.centerTitle}>
          No car selected
        </Text>
        <Text style={styles.centerText}>
          Add or select a car before recording a service.
        </Text>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push('/car/new')}
        >
          <Text style={styles.actionButtonText}>
            Add Car
          </Text>
        </Pressable>
      </View>
    );
  }

  const saving =
    isSubmitting || createService.isPending;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <ArrowLeft
            size={24}
            color={COLORS.navy}
          />
        </Pressable>

        <Text style={styles.headerTitle}>
          Add Service
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabsContainer}>
        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('manual')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'manual' &&
                styles.tabTextActive,
            ]}
          >
            Manual
          </Text>

          {activeTab === 'manual' && (
            <View style={styles.tabIndicator} />
          )}
        </Pressable>

        <Pressable
          style={styles.tab}
          onPress={() => setActiveTab('scan')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'scan' &&
                styles.tabTextActive,
            ]}
          >
            Scan Document
          </Text>

          {activeTab === 'scan' && (
            <View style={styles.tabIndicator} />
          )}
        </Pressable>
      </View>

      {activeTab === 'manual' ? (
        <>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.vehiclePill}>
              <CarFront
                size={16}
                color={COLORS.blue}
              />
              <Text
                style={styles.vehicleText}
                numberOfLines={1}
              >
                {car.make} {car.model} · {car.year}
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <FieldLabel>Date</FieldLabel>

              <Controller
                control={control}
                name="date"
                render={({ field, fieldState }) => (
                  <>
                    <View style={styles.inputContainer}>
                      <CalendarDays
                        size={20}
                        color={COLORS.text}
                      />
                      <TextInput
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#A4B7C9"
                        style={styles.input}
                        autoCapitalize="none"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <FieldError
                      message={fieldState.error?.message}
                    />
                  </>
                )}
              />
            </View>

            <View style={styles.fieldGroup}>
              <FieldLabel>Mileage (km)</FieldLabel>

              <Controller
                control={control}
                name="mileage"
                render={({ field, fieldState }) => (
                  <>
                    <View style={styles.inputContainer}>
                      <Route
                        size={21}
                        color={COLORS.text}
                      />
                      <TextInput
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="126665"
                        placeholderTextColor="#A4B7C9"
                        keyboardType="number-pad"
                        style={styles.input}
                      />
                    </View>
                    <FieldError
                      message={fieldState.error?.message}
                    />
                  </>
                )}
              />
            </View>

            <View style={styles.fieldGroup}>
              <FieldLabel>
                Service description
              </FieldLabel>

              <Controller
                control={control}
                name="serviceName"
                render={({ field, fieldState }) => (
                  <>
                    <View
                      style={[
                        styles.inputContainer,
                        styles.descriptionContainer,
                      ]}
                    >
                      <FileText
                        size={20}
                        color={COLORS.text}
                        style={styles.descriptionIcon}
                      />
                      <TextInput
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Describe the service performed"
                        placeholderTextColor="#A4B7C9"
                        multiline
                        textAlignVertical="top"
                        autoCapitalize="sentences"
                        style={[
                          styles.input,
                          styles.descriptionInput,
                        ]}
                      />
                    </View>
                    <FieldError
                      message={fieldState.error?.message}
                    />
                  </>
                )}
              />
            </View>

            <View style={styles.fieldGroup}>
              <FieldLabel>Total cost</FieldLabel>

              <View style={styles.costRow}>
                <View style={styles.costInputWrapper}>
                  <Controller
                    control={control}
                    name="totalCost"
                    render={({ field, fieldState }) => (
                      <>
                        <View style={styles.inputContainer}>
                          <Coins
                            size={20}
                            color={COLORS.text}
                          />
                          <TextInput
                            value={field.value}
                            onChangeText={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="0.00"
                            placeholderTextColor="#A4B7C9"
                            keyboardType="decimal-pad"
                            style={styles.input}
                          />
                        </View>
                        <FieldError
                          message={fieldState.error?.message}
                        />
                      </>
                    )}
                  />
                </View>

                <Controller
                  control={control}
                  name="currency"
                  render={({ field }) => (
                    <View style={styles.currencyWrapper}>
                      <Pressable
                        style={styles.currencyButton}
                        onPress={() =>
                          setCurrencyOpen(!currencyOpen)
                        }
                      >
                        <Text style={styles.currencyButtonText}>
                          {field.value}
                        </Text>
                        <ChevronDown
                          size={16}
                          color={COLORS.text}
                        />
                      </Pressable>

                      {currencyOpen && (
                        <View style={styles.currencyDropdown}>
                          {supportedCurrencyOptions.map(
                            (option) => (
                              <Pressable
                                key={option.value}
                                style={styles.currencyOption}
                                onPress={() => {
                                  field.onChange(option.value);
                                  setCurrencyOpen(false);
                                }}
                              >
                                <Text
                                  style={styles.currencyOptionText}
                                >
                                  {option.label}
                                </Text>
                                {field.value === option.value && (
                                  <Check
                                    size={15}
                                    color={COLORS.blue}
                                  />
                                )}
                              </Pressable>
                            ),
                          )}
                        </View>
                      )}
                    </View>
                  )}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <FieldLabel>
                Workshop
              </FieldLabel>

              <Controller
                control={control}
                name="workshop"
                render={({ field, fieldState }) => (
                  <>
                    <View style={styles.inputContainer}>
                      <MapPin
                        size={20}
                        color={COLORS.text}
                      />
                      <TextInput
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="Workshop name (optional)"
                        placeholderTextColor="#A4B7C9"
                        style={styles.input}
                      />
                    </View>
                    <FieldError
                      message={fieldState.error?.message}
                    />
                  </>
                )}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[
                styles.saveButton,
                saving && styles.disabledButton,
              ]}
              onPress={handleSubmit(handleCreate)}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color={COLORS.navy}
                />
              ) : (
                <Text style={styles.saveButtonText}>
                  Save Service
                </Text>
              )}
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.scanScreen}>
          <View style={styles.scanArtwork}>
            <View style={styles.sunCircle} />

            <View style={styles.mountainBack} />
            <View style={styles.mountainFront} />

            <View style={styles.documentIllustration}>
              <View style={styles.documentFold} />

              <View style={styles.documentLineLong} />
              <View style={styles.documentLineShort} />
              <View style={styles.documentLineLong} />
              <View style={styles.documentLineMedium} />
              <View style={styles.documentLineLong} />
              <View style={styles.documentLineShort} />
            </View>

            <View style={styles.cameraCircle}>
              <Camera
                size={32}
                color={COLORS.white}
                strokeWidth={2.5}
              />
            </View>
          </View>

          <View style={styles.scanTextArea}>
            <Text style={styles.scanTitle}>
              Scan Service Document
            </Text>

            <Text style={styles.scanSubtitle}>
              Take a photo or choose a file to
              automatically fill in the service details.
            </Text>
          </View>

          <View style={styles.scanActions}>
            <Pressable
              style={styles.takePhotoButton}
              onPress={handleScanDocument}
            >
              <Camera
                size={22}
                color={COLORS.navy}
                strokeWidth={2.5}
              />
              <Text style={styles.takePhotoText}>
                Take Photo
              </Text>
            </Pressable>

            <Pressable
              style={styles.galleryButton}
              onPress={handleChooseDocument}
              disabled={isChoosingDocument}
            >
              {isChoosingDocument ? (
                <ActivityIndicator
                  color={COLORS.navy}
                />
              ) : (
                <>
                  <ImageIcon
                    size={22}
                    color={COLORS.navy}
                    strokeWidth={2.5}
                  />
                  <Text style={styles.galleryButtonText}>
                    Choose from Gallery
                  </Text>
                </>
              )}
            </Pressable>

            <View style={styles.scanHint}>
              <ScanLine
                size={16}
                color={COLORS.muted}
              />
              <Text style={styles.scanHintText}>
                Keep the document clear and well-lit
              </Text>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  header: {
    height: 76,
    backgroundColor: COLORS.sky,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  backButton: {
    width: 40,
    height: 44,
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.navy,
  },

  headerSpacer: {
    width: 40,
  },

  tabsContainer: {
    height: 57,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    paddingHorizontal: 20,
  },

  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.muted,
  },

  tabTextActive: {
    color: COLORS.navy,
  },

  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: COLORS.yellow,
  },

  scroll: {
    flex: 1,
  },

  formContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 19,
  },

  vehiclePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#EFF8FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 1,
  },

  vehicleText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },

  fieldGroup: {
    gap: 7,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
    marginLeft: 3,
  },

  inputContainer: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.field,
    borderRadius: 12,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: 12,
  },

  descriptionContainer: {
    minHeight: 82,
    alignItems: 'flex-start',
    paddingTop: 12,
  },

  descriptionIcon: {
    marginTop: 2,
  },

  descriptionInput: {
    minHeight: 62,
    paddingTop: 0,
    paddingBottom: 10,
    fontWeight: '500',
    lineHeight: 21,
  },

  fieldError: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 3,
  },

  costRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },

  costInputWrapper: {
    flex: 1,
  },

  currencyWrapper: {
    width: 104,
    position: 'relative',
    zIndex: 10,
  },

  currencyButton: {
    height: 49,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.field,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  currencyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },

  currencyDropdown: {
    position: 'absolute',
    top: 53,
    right: 0,
    width: 104,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    zIndex: 20,
    elevation: 8,
    shadowColor: '#143F67',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  currencyOption: {
    height: 39,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  currencyOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 18,
    backgroundColor: COLORS.white,
  },

  saveButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: COLORS.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F4BA2B',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },

  disabledButton: {
    opacity: 0.6,
  },

  scanScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scanArtwork: {
    height: 240,
    backgroundColor: COLORS.sky,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  sunCircle: {
    position: 'absolute',
    width: 185,
    height: 185,
    borderRadius: 100,
    backgroundColor: '#C5E8FF',
    top: 15,
    right: -30,
  },

  mountainBack: {
    position: 'absolute',
    bottom: -85,
    left: -45,
    width: 260,
    height: 190,
    backgroundColor: '#ACD7F6',
    transform: [{ rotate: '30deg' }],
    borderRadius: 40,
  },

  mountainFront: {
    position: 'absolute',
    bottom: -105,
    right: -55,
    width: 290,
    height: 180,
    backgroundColor: '#78B9EC',
    transform: [{ rotate: '-25deg' }],
    borderRadius: 45,
  },

  documentIllustration: {
    width: 125,
    height: 163,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingTop: 27,
    paddingHorizontal: 18,
    gap: 12,
    shadowColor: '#2373B3',
    shadowOpacity: 0.13,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },

  documentFold: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 27,
    height: 27,
    backgroundColor: '#D7ECFB',
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 14,
  },

  documentLineLong: {
    height: 5,
    width: '100%',
    borderRadius: 5,
    backgroundColor: '#A5CBE9',
  },

  documentLineShort: {
    height: 5,
    width: '55%',
    borderRadius: 5,
    backgroundColor: '#A5CBE9',
  },

  documentLineMedium: {
    height: 5,
    width: '75%',
    borderRadius: 5,
    backgroundColor: '#A5CBE9',
  },

  cameraCircle: {
    position: 'absolute',
    bottom: 18,
    left: '50%',
    marginLeft: 27,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.blue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#B9E3FF',
  },

  scanTextArea: {
    paddingHorizontal: 32,
    paddingTop: 30,
    alignItems: 'center',
  },

  scanTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
  },

  scanSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 300,
  },

  scanActions: {
    marginTop: 'auto',
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },

  takePhotoButton: {
    height: 57,
    borderRadius: 18,
    backgroundColor: COLORS.yellow,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  takePhotoText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },

  galleryButton: {
    height: 57,
    borderRadius: 18,
    backgroundColor: '#E8F4FC',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },

  galleryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
  },

  scanHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 4,
  },

  scanHintText: {
    fontSize: 12,
    color: COLORS.muted,
  },

  centerScreen: {
    flex: 1,
    backgroundColor: COLORS.sky,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },

  centerTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
  },

  centerText: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },

  actionButton: {
    backgroundColor: COLORS.yellow,
    borderRadius: 16,
    paddingHorizontal: 30,
    paddingVertical: 15,
    marginTop: 12,
  },

  actionButtonText: {
    fontWeight: '800',
    color: COLORS.navy,
  },
});
