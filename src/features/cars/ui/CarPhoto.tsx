
import { CarFront } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    View,
    type ImageStyle,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { useCarPhoto } from '../model/useCarPhoto';

type Props = {
  carId: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  iconSize?: number;
  showLoader?: boolean;
};

export default function CarPhoto({
  carId,
  style,
  imageStyle,
  iconSize = 28,
  showLoader = false,
}: Props) {
  const { data, isLoading } = useCarPhoto(carId);
  const [failedUrl, setFailedUrl] = useState<
    string | null
  >(null);

  const url = data?.url ?? null;

  useEffect(() => {
    setFailedUrl(null);
  }, [url]);

  const showImage = Boolean(
    url && failedUrl !== url,
  );

  return (
    <View style={[styles.container, style]}>
      {showImage ? (
        <Image
          source={{ uri: url! }}
          style={[styles.image, imageStyle]}
          resizeMode="cover"
          onError={() => setFailedUrl(url)}
        />
      ) : (
        <View style={styles.fallback}>
          {isLoading && showLoader ? (
            <ActivityIndicator
              color="#41668B"
              size="small"
            />
          ) : (
            <CarFront
              size={iconSize}
              color="#41668B"
              strokeWidth={1.7}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 64,
    height: 64,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#EAF6FF',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF6FF',
  },
});
