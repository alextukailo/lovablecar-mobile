
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_TOKEN_KEY = 'session_token';

export async function getSessionToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.sessionStorage.getItem(SESSION_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

export async function setSessionToken(
  token: string,
): Promise<void> {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid session token');
  }

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') {
      throw new Error(
        'Browser session storage is unavailable',
      );
    }

    window.sessionStorage.setItem(
      SESSION_TOKEN_KEY,
      token,
    );

    return;
  }

  await SecureStore.setItemAsync(
    SESSION_TOKEN_KEY,
    token,
  );
}

export async function deleteSessionToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(
        SESSION_TOKEN_KEY,
      );
    }

    return;
  }

  await SecureStore.deleteItemAsync(
    SESSION_TOKEN_KEY,
  );
}
