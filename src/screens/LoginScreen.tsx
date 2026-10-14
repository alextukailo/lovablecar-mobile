import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    openTelegramLogin,
    startMobileLogin,
} from '../auth/mobileLogin';


type Props = {
  navigation: {
    navigate: (
      screen: string,
    ) => void;
  };
};


export default function LoginScreen({
  navigation,
}: Props) {

  const [loading, setLoading] =
    useState(false);


  async function handleLogin() {

    if (loading) {
      return;
    }

    setLoading(true);

    try {

      const login =
        await startMobileLogin();


      await openTelegramLogin(
        login.transactionId,
        login.browserState,
      );


      navigation.navigate(
        'TelegramWaiting',
      );

    } catch (error) {

      Alert.alert(
        'Login failed',
        error instanceof Error
          ? error.message
          : 'Please try again',
      );

    } finally {

      setLoading(false);

    }
  }


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>

        <Text style={styles.logo}>
          🚗
        </Text>


        <Text style={styles.title}>
          Welcome to LovableCar
        </Text>


        <Text style={styles.subtitle}>
          Sign in securely with Telegram.
          {'\n'}
          No password required.
        </Text>


        <Pressable
          style={[
            styles.button,
            loading && styles.disabled,
          ]}
          onPress={handleLogin}
          disabled={loading}
        >

          {loading ? (

            <ActivityIndicator
              color="#ffffff"
            />

          ) : (

            <Text style={styles.buttonText}>
              Continue with Telegram
            </Text>

          )}

        </Pressable>


        <Text style={styles.security}>
          🔒 Secure login
          {'  '}
          ⚡ Fast setup
        </Text>

      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f4f6f9',
  },


  card: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },


  logo: {
    fontSize: 48,
    marginBottom: 16,
  },


  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#172033',
  },


  subtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#536174',
  },


  button: {
    marginTop: 32,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0088cc',
    alignItems: 'center',
  },


  disabled: {
    opacity: 0.6,
  },


  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },


  security: {
    marginTop: 24,
    color: '#667085',
    fontSize: 14,
  },

});
