import {
    CameraView,
    useCameraPermissions,
} from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>

        <Text style={styles.permissionTitle}>
          Доступ к камере запрещен
        </Text>

        <Text style={styles.permissionText}>
          LovableCar нужен доступ к вашей камере, чтобы сканировать
          заказ-наряды и автоматически извлекать информацию о сервисе.
        </Text>

        <Pressable
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>
            Разрешить доступ к камере
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

  const takePhoto = async () => {
    if (!cameraRef.current || !cameraReady || isTakingPhoto) {
      return;
    }

    try {
      setIsTakingPhoto(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Photo URI is missing');
      }

      console.log('Photo captured:', photo.uri);

      router.push({
        pathname: '/scanner/preview',
        params: {
          uri: photo.uri,
        },
      });
    } catch (error) {
      console.error('Failed to take photo:', error);

      Alert.alert(
        'Camera error',
        'We could not take the photo. Please try again.',
      );
    } finally {
      setIsTakingPhoto(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        onCameraReady={() => setCameraReady(true)}
      />

      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Фотографирование заказ-наряда
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Scan frame */}
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
            Поместите заказ-наряд в рамку и нажмите кнопку съемки
          </Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottom}>
          <Text style={styles.hint}>
            Убедитесь, что документ хорошо освещен и весь текст виден.
          </Text>

          <Pressable
            style={[
              styles.captureButton,
              !cameraReady && styles.captureButtonDisabled,
            ]}
            onPress={takePhoto}
            disabled={!cameraReady || isTakingPhoto}
          >
            {isTakingPhoto ? (
              <ActivityIndicator size="small" />
            ) : (
              <View style={styles.captureInner} />
            )}
          </Pressable>

          <Text style={styles.gallery}>
            Фотографии из галереи будут добавлены позже
          </Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },

  permissionContainer: {
    flex: 1,
    backgroundColor: '#F7F7F5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
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
  },

  permissionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171717',
  },

  cancelButton: {
    paddingVertical: 16,
  },

  cancelButtonText: {
    fontSize: 16,
    color: '#737373',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
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

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
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

  gallery: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 18,
  },
});
