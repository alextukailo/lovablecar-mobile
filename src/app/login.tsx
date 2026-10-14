
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { useAuth } from '@/auth/AuthContext';
import {
    getSessionToken,
    setSessionToken,
} from '@/auth/sessionStorage';

import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const POLL_INTERVAL_MS = 2000;

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}


/**
 * Show the confirmation code in a local notification.
 *
 * This runs on the device that started the login.
 * It does not require a push token or backend changes.
 *
 * Notification errors must never block authentication.
 */
async function notifyConfirmationCode(
  code: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    let permissions =
      await Notifications.getPermissionsAsync();

    if (!permissions.granted) {
      permissions =
        await Notifications.requestPermissionsAsync();
    }

    if (!permissions.granted) {
      console.info(
        'Notification permission not granted.',
      );
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'LovableCar confirmation code',
        body: `Your login code: ${code}`,
        sound: 'default',
      },
      trigger: null,
    });
  } catch (error) {
    console.warn(
      'Could not display login notification:',
      error,
    );
  }
}

type LoginPhase =
  | 'idle'
  | 'starting'
  | 'waiting'
  | 'exchanging'
  | 'complete';

type StartResponse = {
  transactionId: string;
  browserState: string;
  confirmationCode: string;
  expiresAt: string;
};

type ExchangeResponse = {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    firstName?: string | null;
    username?: string | null;
  };
};

type PendingLogin = {
  transactionId: string;
  challenge: string;
  expiresAt: number;
  confirmationCode: string;
};

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function bytesToBase64Url(
  bytes: Uint8Array,
): string {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];

    result += alphabet[a >> 2];

    result += alphabet[
      ((a & 3) << 4) | ((b ?? 0) >> 4)
    ];

    if (i + 1 < bytes.length) {
      result += alphabet[
        ((b & 15) << 2) | ((c ?? 0) >> 6)
      ];
    }

    if (i + 2 < bytes.length) {
      result += alphabet[c & 63];
    }
  }

  return result;
}

async function generateChallenge(): Promise<string> {
  const bytes =
    await Crypto.getRandomBytesAsync(32);

  return bytesToBase64Url(bytes);
}

async function sha256(
  value: string,
): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    value,
  );
}

async function postJson<T>(
  path: string,
  body: Record<string, string>,
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is not configured',
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    let detail = '';

    try {
      const errorBody = await response.json();

      if (typeof errorBody.message === 'string') {
        detail = errorBody.message;
      }
    } catch {
      // Use the HTTP status if no JSON message exists.
    }

    throw new ApiError(
      response.status,
      detail ||
        `Request failed (${response.status})`,
    );
  }

  return (await response.json()) as T;
}

export default function LoginScreen() {
  const router = useRouter();

  const {
    user,
    refreshSession,
  } = useAuth();

  const [phase, setPhase] =
    useState<LoginPhase>('idle');

  const [
    confirmationCode,
    setConfirmationCode,
  ] = useState<string | null>(null);

  const [message, setMessage] = useState(
    'Sign in securely using your Telegram account.',
  );

  const [
    signedInUser,
    setSignedInUser,
  ] = useState<string | null>(null);

  const pendingRef =
    useRef<PendingLogin | null>(null);

  const exchangeInProgressRef =
    useRef(false);

  const mountedRef = useRef(true);

  const completedRef = useRef(false);

  const pollTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  const pollGenerationRef = useRef(0);

  /**
   * Prevent duplicate notifications for one
   * login transaction.
   */
  const notifiedTransactionRef =
    useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    pollGenerationRef.current += 1;

    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  useEffect(() => {
    if (user) {
      stopPolling();
      router.replace('/');
    }
  }, [user, router, stopPolling]);

  const completeLogin = useCallback(
    async (session: ExchangeResponse) => {
      if (!session.token || !session.user?.id) {
        throw new Error('Invalid session response');
      }

      /*
       * Save the token before verifying the session.
       * The exchange is one-time, so do not exchange
       * the same transaction again after this point.
       */
      await setSessionToken(session.token);

      pendingRef.current = null;
      completedRef.current = true;

      stopPolling();

      try {
        await refreshSession();
      } catch (error) {
        /*
         * Preserve the saved token so a temporary
         * network failure doesn't force another
         * Telegram login.
         */
        const detail =
          error instanceof Error
            ? error.message
            : 'Unknown error';

        if (mountedRef.current) {
          setPhase('complete');
          setConfirmationCode(null);
          setMessage(
            `Telegram login succeeded, but session verification failed: ${detail}`,
          );
        }

        return;
      }

      if (!mountedRef.current) {
        return;
      }

      setConfirmationCode(null);

      setSignedInUser(
        session.user.firstName ||
          session.user.username ||
          'Telegram user',
      );

      setPhase('complete');

      setMessage(
        'You are signed in successfully.',
      );

      router.replace('/');
    },
    [refreshSession, router, stopPolling],
  );

  const pollLogin = useCallback(
    async (generation: number) => {
      if (
        !mountedRef.current ||
        generation !== pollGenerationRef.current ||
        completedRef.current
      ) {
        return;
      }

      const pending = pendingRef.current;

      if (!pending) {
        return;
      }

      if (Date.now() >= pending.expiresAt) {
        stopPolling();
        pendingRef.current = null;

        if (mountedRef.current) {
          setConfirmationCode(null);
          setPhase('idle');
          setMessage(
            'This login has expired. Please start again.',
          );
        }

        return;
      }

      if (exchangeInProgressRef.current) {
        return;
      }

      exchangeInProgressRef.current = true;

      let shouldRetry = true;

      try {
        const session =
          await postJson<ExchangeResponse>(
            '/auth/mobile/exchange',
            {
              transactionId:
                pending.transactionId,
              challenge:
                pending.challenge,
            },
          );

        shouldRetry = false;

        if (
          generation !== pollGenerationRef.current ||
          pendingRef.current !== pending
        ) {
          /*
           * A stale response must not replace
           * the active login session.
           */
          return;
        }

        setPhase('exchanging');

        await completeLogin(session);
      } catch (error) {
        if (
          generation !== pollGenerationRef.current ||
          !mountedRef.current ||
          completedRef.current
        ) {
          return;
        }

        if (
          error instanceof ApiError &&
          error.status === 401
        ) {
          /*
           * The backend currently returns 401
           * while approval is pending.
           *
           * We retry until the transaction
           * expires or is approved.
           */
          if (
            error.message.includes(
              'already been used',
            )
          ) {
            shouldRetry = false;
            stopPolling();
            pendingRef.current = null;
            setConfirmationCode(null);
            setPhase('idle');
            setMessage(
              'This login has already been used. Please start a new login.',
            );
          }
        } else if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          shouldRetry = false;
          stopPolling();
          pendingRef.current = null;
          setConfirmationCode(null);
          setPhase('idle');
          setMessage(error.message);
        } else {
          console.warn(
            'Login polling error:',
            error,
          );
        }
      } finally {
        exchangeInProgressRef.current = false;

        if (
          shouldRetry &&
          mountedRef.current &&
          !completedRef.current &&
          pendingRef.current === pending &&
          generation === pollGenerationRef.current
        ) {
          pollTimerRef.current = setTimeout(
            () => {
              void pollLogin(generation);
            },
            POLL_INTERVAL_MS,
          );
        }
      }
    },
    [completeLogin, stopPolling],
  );

  const startLogin = useCallback(async () => {
    if (
      phase === 'starting' ||
      phase === 'exchanging'
    ) {
      return;
    }

    stopPolling();

    completedRef.current = false;
    pendingRef.current = null;

    setPhase('starting');
    setConfirmationCode(null);
    setSignedInUser(null);
    setMessage('Preparing secure login...');

    try {
      const existingToken =
        await getSessionToken();

      if (existingToken) {
        await refreshSession();

        if (mountedRef.current) {
          router.replace('/');
        }

        return;
      }

      const challenge =
        await generateChallenge();

      const challengeHash =
        await sha256(challenge);

      const transaction =
        await postJson<StartResponse>(
          '/auth/mobile/start',
          {
            challengeHash,
          },
        );

      if (
        !transaction.transactionId ||
        !/^[A-Za-z0-9_-]{43}$/.test(
          transaction.browserState,
        ) ||
        !/^[0-9]{6}$/.test(
          transaction.confirmationCode,
        )
      ) {
        throw new Error(
          'Invalid login response',
        );
      }

      const expiresAt =
        Date.parse(transaction.expiresAt);

      if (
        !Number.isFinite(expiresAt) ||
        expiresAt <= Date.now()
      ) {
        throw new Error(
          'Login transaction expired',
        );
      }

      const pending: PendingLogin = {
        transactionId:
          transaction.transactionId,
        challenge,
        expiresAt,
        confirmationCode:
          transaction.confirmationCode,
      };

      pendingRef.current = pending;

        setConfirmationCode(
        pending.confirmationCode,
        );

        // Automatically copy the code before Safari opens.
        try {
        await Clipboard.setStringAsync(
            pending.confirmationCode,
        );
        } catch (error) {
        console.warn('Could not copy confirmation code:', error);
        }

        setPhase('waiting');

      setMessage(
        'Enter this code in the browser and approve the login with Telegram. LovableCar will continue automatically.',
      );

      /*
       * Notify once per login transaction.
       *
       * The notification is scheduled before
       * opening the Telegram login browser.
       *
       * Notification failures never stop login.
       */
      if (
        notifiedTransactionRef.current !==
        pending.transactionId
      ) {
        notifiedTransactionRef.current =
          pending.transactionId;

        await notifyConfirmationCode(
          pending.confirmationCode,
        );
      }

      /*
       * Start polling before opening the browser.
       * This allows automatic completion as soon
       * as Telegram approval reaches the backend.
       */
      const generation =
        pollGenerationRef.current;

      pollTimerRef.current = setTimeout(
        () => {
          void pollLogin(generation);
        },
        POLL_INTERVAL_MS,
      );

      const loginUrl =
        `${API_URL}/auth/mobile/login` +
        `?transactionId=${encodeURIComponent(
          transaction.transactionId,
        )}` +
        `&state=${encodeURIComponent(
          transaction.browserState,
        )}`;

      await WebBrowser.openBrowserAsync(
        loginUrl,
      );
    } catch (error) {
      /*
       * Opening the external browser can fail
       * even when the transaction is valid.
       * Stop the flow and allow a fresh attempt.
       */
      stopPolling();
      pendingRef.current = null;

      if (!mountedRef.current) {
        return;
      }

      const detail =
        error instanceof Error
          ? error.message
          : 'Unknown error';

      setPhase('idle');
      setConfirmationCode(null);

      Alert.alert(
        'Could not start login',
        detail,
      );

      setMessage(
        `Unable to start login: ${detail}`,
      );
    }
  }, [
    phase,
    pollLogin,
    refreshSession,
    router,
    stopPolling,
  ]);

  const busy =
    phase === 'starting' ||
    phase === 'exchanging';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>
          LovableCar
        </Text>

        <Text style={styles.subtitle}>
          Secure Telegram sign-in
        </Text>

        {phase === 'complete' ? (
          <>
            <Text style={styles.success}>
              Signed in
            </Text>

            <Text style={styles.message}>
              {message}
            </Text>

            <Pressable
              style={styles.button}
              onPress={() =>
                router.replace('/')
              }
            >
              <Text style={styles.buttonText}>
                Continue to LovableCar
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.message}>
              {message}
            </Text>

            {confirmationCode && (
              <View style={styles.codeCard}>
                <Text style={styles.codeLabel}>
                  Your confirmation code
                </Text>

                <Text
                  style={styles.code}
                  selectable={false}
                >
                  {confirmationCode}
                </Text>

                <Text style={styles.codeHelp}>
                  Only enter this code on the
                  LovableCar login page you opened.
                  Never send it to another person.
                </Text>
              </View>
            )}

            {busy && (
              <ActivityIndicator
                size="large"
                style={styles.spinner}
              />
            )}

            {phase === 'idle' && (
              <Pressable
                style={styles.button}
                onPress={startLogin}
              >
                <Text style={styles.buttonText}>
                  Continue with Telegram
                </Text>
              </Pressable>
            )}

            {phase === 'waiting' && (
              <>
                <ActivityIndicator
                  size="large"
                  style={styles.spinner}
                />

                <Text style={styles.waitingText}>
                  Waiting for Telegram approval...
                </Text>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={startLogin}
                >
                  <Text style={styles.secondaryText}>
                    Start a new login
                  </Text>
                </Pressable>
              </>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F9',
    justifyContent: 'center',
    padding: 24,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#172033',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#536174',
  },

  message: {
    marginTop: 24,
    textAlign: 'center',
    color: '#536174',
    fontSize: 15,
    lineHeight: 23,
  },

  codeCard: {
    width: '100%',
    marginTop: 24,
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#EDF7FC',
    alignItems: 'center',
  },

  codeLabel: {
    fontSize: 13,
    color: '#36566C',
    fontWeight: '600',
  },

  code: {
    marginTop: 10,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 7,
    color: '#006A9E',
  },

  codeHelp: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#536174',
  },

  spinner: {
    marginTop: 24,
  },

  waitingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#536174',
    textAlign: 'center',
  },

  button: {
    width: '100%',
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: '#0088CC',
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  secondaryButton: {
    marginTop: 16,
    padding: 12,
  },

  secondaryText: {
    color: '#0088CC',
    fontWeight: '600',
  },

  success: {
    marginTop: 24,
    fontSize: 22,
    fontWeight: '700',
    color: '#067647',
  },
});
