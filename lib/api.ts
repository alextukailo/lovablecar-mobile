import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
} from 'axios';

import {
    clearSessionToken,
    getSessionToken,
} from './auth-session';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.warn('EXPO_PUBLIC_API_URL is not configured.');
}

/**
 * Tracks the session token used by an individual request.
 *
 * This lets us distinguish a failed request from an
 * old session from a request using the current session.
 */
interface AuthenticatedRequestConfig
  extends InternalAxiosRequestConfig {
  _sessionToken?: string;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Attach the current session token to API requests.
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const request =
      config as AuthenticatedRequestConfig;

    const token = await getSessionToken();

    if (token) {
      request._sessionToken = token;

      request.headers.set(
        'Authorization',
        `Bearer ${token}`,
      );
    }

    return request;
  },
);

/**
 * Clear an invalid session only when the rejected
 * request used the token that is still stored.
 *
 * A delayed 401 from an older session must not
 * log out a newly authenticated user.
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const request =
      error.config as
        | AuthenticatedRequestConfig
        | undefined;

    const rejectedToken = request?._sessionToken;

    if (!rejectedToken) {
      return Promise.reject(error);
    }

    const currentToken = await getSessionToken();

    if (currentToken === rejectedToken) {
      await clearSessionToken();
    }

    return Promise.reject(error);
  },
);
