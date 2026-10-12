
import { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    fetchCars,
    type ApiCar,
} from '../../lib/cars.api';

export default function ApiTestScreen() {
  const [cars, setCars] = useState<ApiCar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tested, setTested] = useState(false);

  const handleTestConnection = async () => {
    setLoading(true);
    setError(null);
    setTested(false);

    try {
      const result = await fetchCars();

      setCars(result);
      setTested(true);
    } catch (err) {
      setCars([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Unknown API error',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        Backend Connection Test
      </Text>

      <Text style={styles.description}>
        Fetch cars directly from the NestJS backend
        without changing local app data.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => void handleTestConnection()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Connecting...'
            : 'Test API Connection'}
        </Text>
      </Pressable>

      {loading && (
        <ActivityIndicator size="large" />
      )}

      {error && (
        <Text style={styles.error}>
          Connection failed: {error}
        </Text>
      )}

      {tested && (
        <View style={styles.result}>
          <Text style={styles.success}>
            API connection successful!
          </Text>

          <Text style={styles.count}>
            Cars found: {cars.length}
          </Text>

          {cars.map((car) => (
            <View
              key={car.id}
              style={styles.carCard}
            >
              <Text style={styles.carName}>
                {car.make} {car.model}
              </Text>

              <Text>
                Year: {car.year}
              </Text>

              <Text>
                Mileage:{' '}
                {car.mileage.toLocaleString()} km
              </Text>

              <Text selectable>
                ID: {car.id}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#202938',
  },
  description: {
    fontSize: 14,
    color: '#737B89',
    lineHeight: 21,
  },
  button: {
    backgroundColor: '#246BFD',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  result: {
    gap: 12,
  },
  success: {
    color: '#276749',
    fontSize: 16,
    fontWeight: '700',
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
  },
  carCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  carName: {
    fontSize: 18,
    fontWeight: '700',
  },
  error: {
    color: '#C53030',
    fontSize: 14,
  },
});
