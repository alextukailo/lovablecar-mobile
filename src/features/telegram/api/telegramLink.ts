
import { getSessionToken } from '@/features/auth/model/sessionStorage';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://lovablecar-backend.vercel.app';

export type TelegramLinkStatus = {
  connected: boolean;
  notificationsEnabled: boolean;
};

async function telegramRequest(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: object,
): Promise<Response> {
  const token = await getSessionToken();

  if (!token) {
    throw new Error('You are not signed in');
  }

  const response = await fetch(
    `${API_URL.replace(/\/$/, '')}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(body
          ? { 'Content-Type': 'application/json' }
          : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'Session expired. Please sign in again.',
      );
    }

    throw new Error(
      `Telegram request failed (${response.status})`,
    );
  }

  return response;
}

export async function getTelegramLinkStatus():
  Promise<TelegramLinkStatus> {
  const response = await telegramRequest(
    '/telegram/link/status',
    'GET',
  );

  return (await response.json()) as TelegramLinkStatus;
}

export async function createTelegramLink(): Promise<{
  url: string;
  expiresAt: string;
}> {
  const response = await telegramRequest(
    '/telegram/link',
    'POST',
  );

  return (await response.json()) as {
    url: string;
    expiresAt: string;
  };
}

export async function setTelegramNotifications(
  enabled: boolean,
): Promise<TelegramLinkStatus> {
  const response = await telegramRequest(
    '/telegram/link/notifications',
    'PATCH',
    { enabled },
  );

  return (await response.json()) as TelegramLinkStatus;
}

export async function disconnectTelegram():
  Promise<TelegramLinkStatus> {
  const response = await telegramRequest(
    '/telegram/link',
    'DELETE',
  );

  return (await response.json()) as TelegramLinkStatus;
}
