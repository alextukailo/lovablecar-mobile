import {
    ImageBackground,
    StyleSheet,
    View,
} from 'react-native';

export default function AppSplashScreen() {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/images/lovablecar-main-background.png')}
        style={styles.background}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DDF2FF',
  },
  background: {
    ...StyleSheet.absoluteFill,
  },
});
