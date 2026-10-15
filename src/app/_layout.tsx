
import { AuthProvider } from '@/auth/AuthContext';

import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import {
    ImageBackground,
    StyleSheet,
    View,
} from 'react-native';

import { useEffect, useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const startupImage = require('../../assets/images/lovablecar-main-background.png');

SplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be hidden.
});

export default function RootLayout() {
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    // The image is bundled locally, so no prefetch is required.
    setImageReady(true);
  }, []);

  useEffect(() => {
    if (imageReady) {
      SplashScreen.hideAsync().catch(() => {
        // Native splash may already be hidden.
      });
    }
  }, [imageReady]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <View style={styles.container}>
          <Stack>
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="index"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />

            <Stack.Screen
              name="service/new"
              options={{
                title: 'Add service',
              }}
            />

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

            <Stack.Screen
              name="car/new"
              options={{
                title: 'Add car',
              }}
            />

            <Stack.Screen
              name="car/[id]"
              options={{
                title: 'Car',
              }}
            />

            <Stack.Screen
              name="car/edit"
              options={{
                title: 'Edit car',
              }}
            />

            <Stack.Screen
              name="service/[id]"
              options={{
                title: 'Service details',
              }}
            />

            <Stack.Screen
              name="service/edit"
              options={{
                title: 'Edit service',
              }}
            />
          </Stack>

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
