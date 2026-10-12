
import {
    router,
    useLocalSearchParams,
} from 'expo-router';

import {
    ActivityIndicator,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useCars } from '../../features/cars/hooks/useCars';
import { useCarStore } from '../../store/car.store';

function firstParam(
  value?: string | string[],
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function ScannerPreviewScreen() {
  const params = useLocalSearchParams<{
    uri?: string | string[];
    vehicleId?: string | string[];
  }>();

  const uri = firstParam(params.uri);
  const routeVehicleId = firstParam(params.vehicleId);

  const storedSelectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  const {
    data: cars = [],
    isLoading,
    isError,
    refetch,
  } = useCars();

  // Navigation takes priority over the global selection.
  // Both IDs are validated against PostgreSQL data.
  const routeCar = cars.find(
    (item) => item.id === routeVehicleId,
  );

  const storedCar = cars.find(
    (item) => item.id === storedSelectedCarId,
  );

  const car =
    routeCar ??
    storedCar ??
    cars.find((item) => item.isPrimary) ??
    cars[0] ??
    null;

  const handleContinue = () => {
    if (!uri || !car) {
      return;
    }

    // Persist only the selected PostgreSQL car ID.
    selectCar(car.id);

    router.push({
      pathname: '/scanner/processing',
      params: {
        uri,
        vehicleId: car.id,
      },
    });
  };

  if (!uri) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.title}>
          No document selected
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <ActivityIndicator
          size="large"
          color="#F5C400"
        />

        <Text style={styles.statusText}>
          Loading car information...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.title}>
          Unable to load cars
        </Text>

        <Text style={styles.statusText}>
          Please check your connection.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => void refetch()}
        >
          <Text style={styles.buttonText}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Preview document
      </Text>

      {car ? (
        <Text style={styles.carName}>
          {car.make} {car.model}
        </Text>
      ) : (
        <Text style={styles.carName}>
          No car selected
        </Text>
      )}

      <Image
        source={{ uri }}
        style={styles.previewImage}
        resizeMode="contain"
      />

      <Text style={styles.description}>
        Check that the service document is readable
        before continuing.
      </Text>

      <Pressable
        style={[
          styles.button,
          !car && styles.buttonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!car}
      >
        <Text style={styles.buttonText}>
          Continue to processing
        </Text>
      </Pressable>

      {!car && (
        <Pressable
          style={styles.cancelButton}
          onPress={() => {
            router.push('/(tabs)/cars');
          }}
        >
          <Text style={styles.cancelButtonText}>
            Select a car
          </Text>
        </Pressable>
      )}

      <Pressable
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelButtonText}>
          Cancel
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#171717',
  },

  carName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#737373',
    marginTop: 8,
  },

  previewImage: {
    width: '100%',
    height: 420,
    marginTop: 20,
    backgroundColor: '#E5E5E5',
    borderRadius: 16,
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#737373',
    marginTop: 16,
  },

  button: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: '#F5C400',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
  },

  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#737373',
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  statusText: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
    marginTop: 14,
  },
});
