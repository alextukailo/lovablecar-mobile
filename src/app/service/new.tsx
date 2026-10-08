import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function NewServiceScreen() {
  const openCamera = () => {
    router.push('/scanner');
  };

  const openGallery = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const asset = result.assets[0];

    router.push({
      pathname: '/scanner/processing',
      params: {
        uri: asset.uri,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add service</Text>

      <Text style={styles.subtitle}>
        Add a service record manually or scan a service document.
      </Text>

      <Pressable style={styles.card} onPress={openCamera}>
        <Text style={styles.icon}>📷</Text>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Scan document</Text>
          <Text style={styles.cardDescription}>
            Take a photo of your service order
          </Text>
        </View>
      </Pressable>

      <Pressable style={styles.card} onPress={openGallery}>
        <Text style={styles.icon}>🖼️</Text>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Choose from gallery</Text>
          <Text style={styles.cardDescription}>
            Select an existing photo
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    padding: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#171717',
    marginTop: 20,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#737373',
    marginTop: 8,
    marginBottom: 32,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  icon: {
    fontSize: 32,
    marginRight: 16,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
  },

  cardDescription: {
    fontSize: 14,
    color: '#737373',
    marginTop: 4,
  },
});
