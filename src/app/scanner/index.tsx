
import {
    CameraView,
    useCameraPermissions,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import {
    router,
    useLocalSearchParams,
} from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useCars } from '../../features/cars/hooks/useCars';
import { useCarStore } from '../../store/car.store';

export default function ScannerScreen() {
  const params = useLocalSearchParams<{
    vehicleId?: string | string[];
  }>();

  const [permission, requestPermission] =
    useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);

  const [cameraReady, setCameraReady] =
    useState(false);

  const [isTakingPhoto, setIsTakingPhoto] =
    useState(false);

  const [isChoosingImage, setIsChoosingImage] =
    useState(false);

  const {
    data: cars = [],
    isLoading: isLoadingCars,
    isError: isCarsError,
    refetch: refetchCars,
  } = useCars();

  const storedSelectedCarId = useCarStore(
    (state) => state.selectedCarId,
  );

  const selectCar = useCarStore(
    (state) => state.selectCar,
  );

  const routeVehicleId = Array.isArray(
    params.vehicleId,
  )
    ? params.vehicleId[0]
    : params.vehicleId;

  // Validate the route ID against PostgreSQL data.
  const routeCar = cars.find(
    (car) => car.id === routeVehicleId,
  );

  // The selected ID comes from Zustand.
  const storedCar = cars.find(
    (car) => car.id === storedSelectedCarId,
  );

  const selectedCar =
    routeCar ??
    storedCar ??
    cars.find((car) => car.isPrimary) ??
    cars[0] ??
    null;

  const vehicleId = selectedCar?.id;

  const openPreview = (uri: string) => {
    if (!vehicleId) {
      Alert.alert(
        'No car selected',
        'Please select a car before scanning a document.',
      );
      return;
    }

    // Store the selected PostgreSQL car ID.
    selectCar(vehicleId);

    router.push({
      pathname: '/scanner/preview',
      params: {
        uri,
        vehicleId,
      },
    });
  };

  const takePhoto = async () => {
    if (
      !cameraRef.current ||
      !cameraReady ||
      isTakingPhoto ||
      !vehicleId
    ) {
      return;
    }

    try {
      setIsTakingPhoto(true);

      const photo =
        await cameraRef.current.takePictureAsync({
          quality: 0.9,
          skipProcessing: false,
        });

      if (!photo?.uri) {
        throw new Error('Photo URI is missing');
      }

      openPreview(photo.uri);
    } catch (error) {
      console.error(
        'Failed to take photo:',
        error,
      );

      Alert.alert(
        'Camera error',
        'We could not take the photo. Please try again.',
      );
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const chooseImage = async () => {
    if (isChoosingImage || !vehicleId) {
      return;
    }

    try {
      setIsChoosingImage(true);

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

      openPreview(result.assets[0].uri);
    } catch (error) {
      console.error(
        'Failed to choose image:',
        error,
      );

      Alert.alert(
        'Gallery error',
        'Could not open the selected image.',
      );
    } finally {
      setIsChoosingImage(false);
    }
  };

  if (isLoadingCars) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#F5C400"
        />

        <Text style={styles.centerText}>
          Loading cars...
        </Text>
      </View>
    );
  }

  if (isCarsError) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerTitle}>
          Could not load cars
        </Text>

        <Text style={styles.centerText}>
          Please check your connection.
        </Text>

        <Pressable
          style={styles.permissionButton}
          onPress={() => void refetchCars()}
        >
          <Text style={styles.permissionButtonText}>
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!vehicleId) {
    return (
      <View style={styles.center}>
        <Text style={styles.centerTitle}>
          No car selected
        </Text>

        <Text style={styles.centerText}>
          Add or select a car before scanning
          a service document.
        </Text>

        <Pressable
          style={styles.permissionButton}
          onPress={() =>
            router.push('/(tabs)/cars')
          }
        >
          <Text style={styles.permissionButtonText}>
            Select a car
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#F5C400"
        />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>
          📷
        </Text>

        <Text style={styles.permissionTitle}>
          Доступ к камере запрещен
        </Text>

        <Text style={styles.permissionText}>
          LovableCar нужен доступ к вашей камере,
          чтобы сканировать заказ-наряды и
          автоматически извлекать информацию
          о сервисе.
        </Text>

        <Pressable
          style={styles.permissionButton}
          onPress={() =>
            void requestPermission()
          }
        >
          <Text style={styles.permissionButtonText}>
            Разрешить доступ к камере
          </Text>
        </Pressable>

        <Pressable
          style={styles.galleryPermissionButton}
          onPress={() => void chooseImage()}
          disabled={isChoosingImage}
        >
          <Text style={styles.galleryPermissionText}>
            {isChoosingImage
              ? 'Opening gallery...'
              : 'Choose from gallery instead'}
          </Text>
        </Pressable>

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

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() =>
          setCameraReady(true)
        }
      />

      <View style={styles.overlay}>
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeText}>
              ✕
            </Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Фотографирование заказ-наряда
            </Text>

            <Text style={styles.carLabel}>
              {selectedCar?.make}{' '}
              {selectedCar?.model}
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.frameContainer}>
          <View style={styles.scanFrame}>
            <View
              style={[
                styles.corner,
                styles.topLeft,
              ]}
            />

            <View
              style={[
                styles.corner,
                styles.topRight,
              ]}
            />

            <View
              style={[
                styles.corner,
                styles.bottomLeft,
              ]}
            />

            <View
              style={[
                styles.corner,
                styles.bottomRight,
              ]}
            />
          </View>

          <Text style={styles.frameHint}>
            Поместите заказ-наряд в рамку
            и нажмите кнопку съемки
          </Text>
        </View>

        <View style={styles.bottom}>
          <Text style={styles.hint}>
            Убедитесь, что документ хорошо
            освещен и весь текст виден.
          </Text>

          <Pressable
            style={[
              styles.captureButton,
              (!cameraReady || isTakingPhoto) &&
                styles.captureButtonDisabled,
            ]}
            onPress={() => void takePhoto()}
            disabled={
              !cameraReady || isTakingPhoto
            }
          >
            {isTakingPhoto ? (
              <ActivityIndicator
                size="small"
              />
            ) : (
              <View
                style={styles.captureInner}
              />
            )}
          </Pressable>

          <Pressable
            style={styles.galleryButton}
            onPress={() => void chooseImage()}
            disabled={isChoosingImage}
          >
            <Text style={styles.gallery}>
              {isChoosingImage
                ? 'Opening gallery...'
                : 'Choose from gallery'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  center: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  centerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#171717',
    textAlign: 'center',
  },

  centerText: {
    fontSize: 15,
    color: '#737373',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },

  permissionContainer: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  permissionIcon: {
    fontSize: 56,
    marginBottom: 24,
  },

  permissionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#171717',
    textAlign: 'center',
  },

  permissionText: {
    fontSize: 16,
    lineHeight: 23,
    color: '#737373',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 28,
  },

  permissionButton: {
    width: '100%',
    backgroundColor: '#F5C400',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  permissionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171717',
  },

  galleryPermissionButton: {
    marginTop: 16,
    padding: 12,
  },

  galleryPermissionText: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '600',
  },

  cancelButton: {
    paddingVertical: 16,
  },

  cancelButtonText: {
    fontSize: 16,
    color: '#737373',
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },

  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    color: '#FFFFFF',
    fontSize: 20,
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  carLabel: {
    color: '#F5C400',
    fontSize: 13,
    marginTop: 5,
  },

  headerSpacer: {
    width: 40,
  },

  frameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  scanFrame: {
    width: '88%',
    height: 280,
  },

  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#FFFFFF',
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },

  frameHint: {
    color: '#FFFFFF',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 18,
    paddingHorizontal: 20,
  },

  bottom: {
    alignItems: 'center',
    paddingBottom: 40,
  },

  hint: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 290,
    marginBottom: 24,
  },

  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  captureButtonDisabled: {
    opacity: 0.5,
  },

  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#171717',
  },

  galleryButton: {
    padding: 12,
    marginTop: 6,
  },

  gallery: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
