import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function ProcessingScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();

  useEffect(() => {
    if (!uri) {
      return;
    }

    const processDocument = async () => {
      // Mock OCR + AI processing
      await new Promise((resolve) => setTimeout(resolve, 2500));

      router.replace({
        pathname: '/scanner/review',
        params: {
          uri,
          date: '2026-10-08',
          mileage: '128450',
          serviceName: 'Engine oil change',
          totalCost: '420',
          currency: 'BYN',
          workshop: 'Auto Service Center',
        },
      });
    };

    processDocument();
  }, [uri]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✨</Text>
      </View>

      <Text style={styles.title}>
        Reading your service document
      </Text>

      <Text style={styles.description}>
        We are extracting the service date, mileage, work performed
        and total cost.
      </Text>

      <ActivityIndicator
        size="large"
        style={styles.loader}
      />

      <Text style={styles.status}>
        Analyzing document...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF4B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },

  icon: {
    fontSize: 36,
  },

  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#171717',
  },

  description: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#737373',
    textAlign: 'center',
  },

  loader: {
    marginTop: 36,
  },

  status: {
    marginTop: 16,
    color: '#737373',
    fontSize: 14,
  },
});
