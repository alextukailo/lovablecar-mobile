
import {
    deleteSessionToken,
    getSessionToken as getStoredSessionToken,
    setSessionToken,
} from '../src/features/auth/model/sessionStorage';

const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

/**
 * Save a backend-issued session token.
 *
 * Uses the same storage implementation as
 * Telegram login and AuthContext:
 *
 * Web: window.sessionStorage
 * iOS/Android: Expo SecureStore
 */
export async function saveSessionToken(
  token: string,
): Promise<void> {
  if (!SESSION_TOKEN_PATTERN.test(token)) {
    throw new Error('Invalid session token format');
  }

  await setSessionToken(token);
}

/**
 * Retrieve the session token saved by
 * Telegram login.
 */
export async function getSessionToken(): Promise<
  string | null
> {
  const token = await getStoredSessionToken();

  if (!token) {
    return null;
  }

  if (!SESSION_TOKEN_PATTERN.test(token)) {
    await deleteSessionToken();
    return null;
  }

  return token;
}

/**
 * Clear the locally stored session token.
 *
 * This does not revoke the backend session.
 */
export async function clearSessionToken(): Promise<void> {
  await deleteSessionToken();
}
