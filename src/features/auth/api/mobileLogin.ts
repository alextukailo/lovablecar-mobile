import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import { apiRequest } from '@/api/client';


type MobileLoginStartResponse = {
  transactionId: string;
  expiresAt: string;
  browserState: string;
  confirmationCode: string;
};


type MobileLoginExchangeResponse = {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    telegramUserId: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    photoUrl: string | null;
  };
};


async function createChallenge(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);

  return Buffer
    .from(bytes)
    .toString('base64url');
}


async function hashChallenge(
  challenge: string,
): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    challenge,
  );
}


export async function startMobileLogin() {

  const challenge =
    await createChallenge();


  const challengeHash =
    await hashChallenge(challenge);


  const response =
    await apiRequest<MobileLoginStartResponse>(
      '/auth/mobile/start',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challengeHash,
        }),
      },
    );


  await SecureStore.setItemAsync(
    'mobile_login_challenge',
    challenge,
  );


  await SecureStore.setItemAsync(
    'mobile_login_transaction',
    response.transactionId,
  );


  return response;
}


export async function openTelegramLogin(
  transactionId: string,
  browserState: string,
) {

  const url =
    `${process.env.EXPO_PUBLIC_API_URL}/auth/mobile/login`
    + `?transactionId=${encodeURIComponent(transactionId)}`
    + `&state=${encodeURIComponent(browserState)}`;


  await WebBrowser.openBrowserAsync(url);
}


export async function exchangeMobileLogin() {

  const transactionId =
    await SecureStore.getItemAsync(
      'mobile_login_transaction',
    );


  const challenge =
    await SecureStore.getItemAsync(
      'mobile_login_challenge',
    );


  if (!transactionId || !challenge) {
    throw new Error(
      'No pending login found',
    );
  }


  return apiRequest<MobileLoginExchangeResponse>(
    '/auth/mobile/exchange',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId,
        challenge,
      }),
    },
  );
}


export async function saveSession(
  token: string,
) {
  await SecureStore.setItemAsync(
    'session_token',
    token,
  );
}


export async function clearMobileLogin() {

  await SecureStore.deleteItemAsync(
    'mobile_login_challenge',
  );

  await SecureStore.deleteItemAsync(
    'mobile_login_transaction',
  );
}
