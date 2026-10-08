import { router, useLocalSearchParams } from 'expo-router';
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function ScannerPreviewScreen() {
  const { uri } = useLocalSearchParams<{ uri: string }>();

  if (!uri) {
    return (
      <View style={styles.container}>
        <Text>No image selected</Text>
      </View>
    );
  }

  const handleConfirm = () => {
    router.push({
      pathname: '/scanner/processing',
      params: {
        uri,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} />

      <View style={styles.bottom}>
        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryText}>Retake</Text>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={handleConfirm}
        >
          <Text style={styles.primaryText}>Use this photo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  image: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain',
  },

  bottom: {
    padding: 20,
    gap: 12,
    backgroundColor: '#000',
  },

  primaryButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F5C400',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryText: {
    color: '#171717',
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
