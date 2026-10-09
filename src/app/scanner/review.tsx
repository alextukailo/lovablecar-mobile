
import { router, useLocalSearchParams } from 'expo-router';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import ServiceForm from '../../features/services/components/ServiceForm';
import {
    getLocalDateString,
    type ServiceFormValues,
} from '../../features/services/schemas/service.schema';
import { useCarStore } from '../../store/car.store';
import { useServiceStore } from '../../store/service.store';

const supportedCurrencies = [
  'BYN',
  'USD',
  'EUR',
  'PLN',
  'GBP',
  'RUB',
] as const;

function getParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getSupportedCurrency(value?: string): ServiceFormValues['currency'] {
  if (
    value &&
    supportedCurrencies.includes(
      value as (typeof supportedCurrencies)[number],
    )
  ) {
    return value as ServiceFormValues['currency'];
  }

  return 'BYN';
}

export default function ReviewServiceScreen() {
  const params = useLocalSearchParams<{
    uri?: string;
    date?: string;
    mileage?: string;
    serviceName?: string;
    totalCost?: string;
    currency?: string;
    workshop?: string;
  }>();

  const uri = getParam(params.uri);
  const selectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectedCar = useCarStore((state) =>
    state.cars.find((car) => car.id === state.selectedCarId),
  );

  const updateCar = useCarStore(
    (state) => state.updateCar,
  );

  const addService = useServiceStore(
    (state) => state.addService,
  );

  const defaultValues: ServiceFormValues = {
    date: getParam(params.date) || getLocalDateString(),
    mileage:
      getParam(params.mileage) ??
      (selectedCar ? String(selectedCar.mileage) : ''),
    serviceName: getParam(params.serviceName) ?? '',
    totalCost: getParam(params.totalCost) ?? '0',
    currency: getSupportedCurrency(getParam(params.currency)),
    workshop: getParam(params.workshop) ?? '',
  };

  const handleConfirm = (values: ServiceFormValues) => {
    if (!selectedCarId) {
      Alert.alert(
        'No car selected',
        'Select a car before saving this service.',
      );
      return;
    }

    const mileage = Number(values.mileage);
    const totalCost = Number(
      values.totalCost.replace(',', '.'),
    );

    addService({
      vehicleId: selectedCarId,
      date: values.date,
      mileage,
      serviceName: values.serviceName.trim(),
      totalCost,
      currency: values.currency,
      workshop: values.workshop.trim() || undefined,
      documentUri: uri,
    });

    if (selectedCar && mileage > selectedCar.mileage) {
      updateCar(selectedCarId, { mileage });
    }

    router.replace('/(tabs)/services');
  };

  if (!selectedCarId || !selectedCar) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.title}>No car selected</Text>
        <Text style={styles.description}>
          Select a car before reviewing the service record.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.replace('/(tabs)/cars')}
        >
          <Text style={styles.buttonText}>Choose a car</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Review service</Text>
        <Text style={styles.description}>
          Check the extracted details and correct anything that is wrong.
        </Text>
      </View>

      <ServiceForm
        key={selectedCarId}
        defaultValues={defaultValues}
        submitLabel="Confirm and save"
        onSubmit={handleConfirm}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#171717',
  },
  description: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 21,
    color: '#737373',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F7F7F5',
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F5C400',
  },
  buttonText: {
    fontWeight: '700',
    color: '#171717',
  },
});
