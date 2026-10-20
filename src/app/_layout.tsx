
import { AuthProvider } from '@/features/auth/model/AuthContext';
import AppSplashScreen from '@/shared/ui/AppSplashScreen';
import { restoreLanguage } from '@/i18n';

import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import {
    StyleSheet,
    View
} from 'react-native';

import {
    useCallback,
    useEffect,
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

export default function RootLayout() {
  const [nativeSplashHidden, setNativeSplashHidden] =
    useState(false);

  const [languageReady, setLanguageReady] =
    useState(false);

  // Restore the saved language before showing the app.
  useEffect(() => {
    let mounted = true;

    restoreLanguage()
      .catch((error) => {
        console.warn(
          '[i18n] Language initialization failed:',
          error,
        );
      })
      .finally(() => {
        if (mounted) {
          setLanguageReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Hide native splash only after language initialization.
  const handleLayout = useCallback(() => {
    if (nativeSplashHidden || !languageReady) {
      return;
    }

    setNativeSplashHidden(true);

    void SplashScreen.hideAsync().catch(() => {
      // Native splash may already be hidden.
    });
  }, [nativeSplashHidden, languageReady]);

  // Handle the case where layout finishes before
  // the saved language has been restored.
  useEffect(() => {
    if (languageReady && !nativeSplashHidden) {
      handleLayout();
    }
  }, [
    languageReady,
    nativeSplashHidden,
    handleLayout,
  ]);

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
              options={{ headerShown: false }}
            />

            <Stack.Screen
              name="service/edit"
              options={{
                title: 'Edit service',
              }}
            />
          </Stack>

          {(!nativeSplashHidden || !languageReady) && (
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
