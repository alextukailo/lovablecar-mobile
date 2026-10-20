
import {
    router,
    useLocalSearchParams,
} from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useCars } from '@/features/cars/model/useCars';
import { recognizeDocumentText } from '@/features/scanner/api/ocr.service';
import { parseServiceText } from '@/features/scanner/api/service-parser';
import { useCarStore } from '@/entities/car/model/car.store';

function getParam(
  value?: string | string[],
): string {
  return Array.isArray(value)
    ? value[0] ?? ''
    : value ?? '';
}

export default function ScannerProcessingScreen() {
  const params = useLocalSearchParams<{
    uri?: string | string[];
    vehicleId?: string | string[];
  }>();

  const uri = getParam(params.uri);
  const requestedVehicleId = getParam(
    params.vehicleId,
  );

  const selectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  const {
    data: cars = [],
    isLoading: isLoadingCars,
    isError: isCarsError,
    refetch: refetchCars,
  } = useCars();

  const car = useMemo(() => {
    const requestedCar = cars.find(
      (item) => item.id === requestedVehicleId,
    );

    const storedCar = cars.find(
      (item) => item.id === selectedCarId,
    );

    return (
      requestedCar ??
      storedCar ??
      cars.find((item) => item.isPrimary) ??
      cars[0] ??
      null
    );
  }, [cars, requestedVehicleId, selectedCarId]);

  const carId = car?.id ?? '';

  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function processDocument() {
      if (isLoadingCars) {
        return;
      }

      if (isCarsError) {
        setError(
          'Could not load car information. Check your connection and try again.',
        );
        return;
      }

      setError('');

      if (!uri) {
        setError(
          'No document image was provided. Please select a photo again.',
        );
        return;
      }

      if (!car) {
        setError(
          'Select a car before scanning a service document.',
        );
        return;
      }

      try {
        const result =
          await recognizeDocumentText(uri);

        if (cancelled) {
          return;
        }

        const parsed = parseServiceText(
          result.text,
        );

        console.log('OCR PARSED FIELDS:', {
          date: parsed.date,
          mileage: parsed.mileage,
          serviceName: parsed.serviceName,
          totalCost: parsed.totalCost,
          currency: parsed.currency,
          workshop: parsed.workshop,
        });

        // Store only the selected PostgreSQL ID.
        selectCar(car.id);

        router.replace({
          pathname: '/scanner/review',
          params: {
            uri,
            vehicleId: car.id,
            date: parsed.date,
            mileage:
              parsed.mileage ||
              String(car.mileage),
            serviceName: parsed.serviceName,
            totalCost: parsed.totalCost,
            currency: parsed.currency,
            workshop: parsed.workshop,
          },
        });
      } catch (cause) {
        if (cancelled) {
          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : 'Something went wrong while recognizing the document.',
        );
      }
    }

    void processDocument();

    return () => {
      cancelled = true;
    };
  }, [
    uri,
    carId,
    isLoadingCars,
    isCarsError,
    attempt,
    selectCar,
  ]);

  if (isLoadingCars) {
    return (
      <View style={styles.container}>
        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color="#246BFD"
          />
        </View>

        <Text style={styles.title}>
          Loading car information
        </Text>

        <Text style={styles.description}>
          Preparing your document for recognition.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorIconText}>
            !
          </Text>
        </View>

        <Text style={styles.title}>
          Could not process document
        </Text>

        <Text style={styles.description}>
          {error}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            if (isCarsError) {
              void refetchCars();
            }

            setAttempt(
              (current) => current + 1,
            );
          }}
        >
          <Text style={styles.primaryButtonText}>
            Try again
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#246BFD"
        />
      </View>

      <Text style={styles.title}>
        Reading your document
      </Text>

      <Text style={styles.description}>
        We’re extracting text from your service
        document and preparing suggested values.
        You’ll be able to review and correct them
        before saving.
      </Text>

      {car ? (
        <View style={styles.carCard}>
          <Text style={styles.carLabel}>
            Selected car
          </Text>

          <Text style={styles.carName}>
            {car.make} {car.model} ({car.year})
          </Text>
        </View>
      ) : null}

      <Text style={styles.privacyNote}>
        The document image is sent to the
        configured OCR provider for recognition.
      </Text>

      <Pressable
        style={styles.secondaryButton}
        onPress={() => router.back()}
      >
        <Text style={styles.secondaryButtonText}>
          Cancel
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },

  loader: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#E8F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },

  title: {
    color: '#252A34',
    fontSize: 23,
    fontWeight: '800',
    textAlign: 'center',
  },

  description: {
    color: '#737B89',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 12,
  },

  carCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },

  carLabel: {
    color: '#737B89',
    fontSize: 12,
  },

  carName: {
    color: '#252A34',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 5,
  },

  privacyNote: {
    color: '#737B89',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 20,
  },

  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FCE8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  errorIconText: {
    color: '#C53030',
    fontSize: 32,
    fontWeight: '800',
  },

  primaryButton: {
    width: '100%',
    backgroundColor: '#246BFD',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  secondaryButton: {
    width: '100%',
    backgroundColor: '#E9ECF1',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 12,
  },

  secondaryButtonText: {
    color: '#252A34',
    fontSize: 15,
    fontWeight: '700',
  },
});
