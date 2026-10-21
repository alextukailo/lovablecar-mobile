

import { AuthProvider } from '@/features/auth/model/AuthContext';
import '@/i18n';
import { restoreLanguage } from '@/i18n';
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    ImageBackground,
    StyleSheet,
    View,
} from 'react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const startupImage = require(
  '../../assets/images/lovablecar-main-background.png'
);

SplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be hidden.
});

export default function RootLayout() {
  const { t } = useTranslation();
  const [imageReady, setImageReady] = useState(false);
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void restoreLanguage().finally(() => {
      if (mounted) setLanguageReady(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // The image is bundled locally, so no prefetch is required.
    setImageReady(true);
  }, []);

  useEffect(() => {
    if (imageReady && languageReady) {
      SplashScreen.hideAsync().catch(() => {
        // Native splash may already be hidden.
      });
    }
  }, [imageReady, languageReady]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <View style={styles.container}>
          {languageReady && <Stack
            screenOptions={{
              headerBackTitle: 'Back',
              headerTintColor: '#102647',
              headerStyle: {
                backgroundColor: '#FFFFFF',
              },
              headerTitleStyle: {
                fontWeight: '700',
              },
              contentStyle: {
                backgroundColor: '#EAF6FF',
              },
            }}
          >
            {/* Authentication */}
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
              }}
            />

            {/* Initial redirect */}
            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />

            {/* Main tabs */}
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />

            {/* Cars */}
            <Stack.Screen
              name="car/new"
              options={{
                title: t('carDetails.addCar', { defaultValue: 'Add car' }),
              }}
            />

            <Stack.Screen
              name="car/[id]"
              options={{
                title: t('navigation.cars', { defaultValue: 'Car' }),
              }}
            />

            <Stack.Screen
              name="car/edit"
              options={{
                title: t('carDetails.editCar', { defaultValue: 'Edit car' }),
              }}
            />

            {/* Services */}
            <Stack.Screen
              name="service/new"
              options={{
                title: t('carDetails.addService', { defaultValue: 'Add service' }),
              }}
            />

            <Stack.Screen
              name="service/[id]"
              options={{
                title: t('carDetails.serviceDetails', { defaultValue: 'Service details' }),
              }}
            />

            <Stack.Screen
              name="service/edit"
              options={{
                title: t('carDetails.editService', { defaultValue: 'Edit service' }),
              }}
            />

            <Stack.Screen
              name="reminder/new"
              options={{
                headerShown: false,
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />

            <Stack.Screen
              name="reminder/[id]"
              options={{
                headerShown: false,
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />

            {/* Scanner */}
            <Stack.Screen
              name="scanner"
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
              }}
            />

            <Stack.Screen
              name="scanner/preview"
              options={{
                headerShown: false,
              }}
            />
          </Stack>}

          {!imageReady && (
            <ImageBackground
              source={startupImage}
              style={styles.startupBackground}
              resizeMode="cover"
            />
          )}
        </View>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  startupBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#DDF2FF',
  },
});
