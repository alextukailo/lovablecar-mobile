import { router, Stack, useLocalSearchParams } from 'expo-router';
import {
    StyleSheet,
    Text,
    View
} from 'react-native';

import ServiceForm from '@/features/services/components/ServiceForm';
import type { ServiceFormValues } from '../../features/services/schemas/service.schema';
import { useCarStore } from '../../store/car.store';
import { useServiceStore } from '../../store/service.store';

export default function EditServiceScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const service = useServiceStore((state) =>
    state.services.find((item) => item.id === id),
  );
  const updateService = useServiceStore(
    (state) => state.updateService,
  );
  const car = useCarStore((state) =>
    state.cars.find(
      (item) => item.id === service?.vehicleId,
    ),
  );
  const updateCar = useCarStore((state) => state.updateCar);

  if (!service) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Edit service' }} />
        <Text style={styles.message}>
          Service record not found.
        </Text>
      </View>
    );
  }

  const defaultValues: ServiceFormValues = {
    date: service.date,
    mileage: String(service.mileage),
    serviceName: service.serviceName,
    totalCost: String(service.totalCost),
    currency: service.currency as ServiceFormValues['currency'],
    workshop: service.workshop ?? '',
  };

  const handleSubmit = (values: ServiceFormValues) => {
    const mileage = Number(values.mileage);
    const totalCost = Number(values.totalCost.replace(',', '.'));

    updateService(service.id, {
      date: values.date,
      mileage,
      serviceName: values.serviceName,
      totalCost,
      currency: values.currency,
      workshop: values.workshop || undefined,
    });

    // Never lower the car's current mileage when editing an older record.
    if (car && mileage > car.mileage) {
      updateCar(car.id, { mileage });
    }

    router.replace({
      pathname: '/service/[id]',
      params: { id: service.id },
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Edit service' }} />

      <View style={styles.screen}>
        <ServiceForm
          key={service.id}
          defaultValues={defaultValues}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    fontSize: 16,
    color: '#667085',
  },
});
