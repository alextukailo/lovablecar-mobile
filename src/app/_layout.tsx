
import { AuthProvider } from '@/auth/AuthContext';
import AppSplashScreen from '@/components/AppSplashScreen';

import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import {
    StyleSheet,
    View,
} from 'react-native';

import {
    useCallback,
    useState,
} from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Keep the native splash visible until
// our React Native screen is ready.
void SplashScreen.preventAutoHideAsync().catch(() => {
  // Native splash may already be hidden.
});

export default function RootLayout() {
  const [nativeSplashHidden, setNativeSplashHidden] =
    useState(false);

  const handleLayout = useCallback(() => {
    if (nativeSplashHidden) {
      return;
    }

    setNativeSplashHidden(true);

    void SplashScreen.hideAsync().catch(() => {
      // Native splash may already be hidden.
    });
  }, [nativeSplashHidden]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <View
          style={styles.container}
          onLayout={handleLayout}
        >
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
                headerShown: false,
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

          {!nativeSplashHidden && (
            <View
              pointerEvents="none"
              style={styles.splashOverlay}
            >
              <AppSplashScreen />
            </View>
          )}
        </View>
      </AuthProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DDF2FF',
  },

  splashOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    backgroundColor: '#DDF2FF',
  },
});
