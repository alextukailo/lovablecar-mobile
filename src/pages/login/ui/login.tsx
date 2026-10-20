import { COLORS, styles } from '@/pages/login/ui/login.styles';

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from 'react-native';

import { useAuth } from '@/features/auth/model/AuthContext';
import {
    getSessionToken,
    setSessionToken,
} from '@/features/auth/model/sessionStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const POLL_INTERVAL_MS = 12000;



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
      // Use HTTP status when no JSON message exists.
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

      await setSessionToken(session.token);

      pendingRef.current = null;
      completedRef.current = true;

      stopPolling();

      try {
        await refreshSession();
      } catch (error) {
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

      // Copy the code automatically.
      try {
        await Clipboard.setStringAsync(
          pending.confirmationCode,
        );
      } catch (error) {
        console.warn(
          'Could not copy confirmation code:',
          error,
        );
      }

      setPhase('waiting');

      setMessage(
        'Enter this code in the browser and approve the login with Telegram. LovableCar will continue automatically.',
      );

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
    <ImageBackground
      source={require('../../../../assets/images/lovablecar-main-background.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.screen}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={
              Platform.OS === 'ios'
                ? 'padding'
                : undefined
            }
          >
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.container}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              <View style={styles.card}>
                {phase === 'complete' ? (
                  <>
                    <View style={styles.successIcon}>
                      <Ionicons
                        name="checkmark"
                        size={30}
                        color={COLORS.white}
                      />
                    </View>

                    <Text style={styles.title}>
                      You're all set!
                    </Text>

                    {signedInUser && (
                      <Text style={styles.userName}>
                        Welcome, {signedInUser}
                      </Text>
                    )}

                    <Text style={styles.description}>
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

                      <Ionicons
                        name="arrow-forward"
                        size={19}
                        color={COLORS.navy}
                      />
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={styles.title}>
                      {phase === 'waiting'
                        ? 'Almost there!'
                        : phase === 'starting'
                          ? 'Connecting...'
                          : phase === 'exchanging'
                            ? 'Signing you in...'
                            : 'Welcome back'}
                    </Text>

                    <Text style={styles.description}>
                      {phase === 'idle'
                        ? 'Sign in with Telegram to access your garage and maintenance history.'
                        : message}
                    </Text>

                    {/* CONFIRMATION CODE */}

                    {confirmationCode && (
                      <View style={styles.codeCard}>
                        <View style={styles.codeHeader}>
                          <Ionicons
                            name="key-outline"
                            size={16}
                            color={COLORS.blue}
                          />

                          <Text style={styles.codeLabel}>
                            CONFIRMATION CODE
                          </Text>
                        </View>

                        <Text
                          style={styles.code}
                          selectable={false}
                        >
                          {confirmationCode}
                        </Text>

                        <View style={styles.copiedRow}>
                          <Ionicons
                            name="copy-outline"
                            size={14}
                            color={COLORS.blue}
                          />

                          <Text style={styles.codeHelp}>
                            Automatically copied
                          </Text>
                        </View>

                        <Text style={styles.codeWarning}>
                          Enter this code only on the
                          LovableCar login page you opened.
                          Never share it with anyone.
                        </Text>
                      </View>
                    )}

                    {/* LOADING */}

                    {busy && (
                      <ActivityIndicator
                        size="large"
                        color={COLORS.navy}
                        style={styles.spinner}
                      />
                    )}

                    {/* LOGIN BUTTON */}

                    {phase === 'idle' && (
                      <Pressable
                        onPress={startLogin}
                        style={({ pressed }) => [
                          styles.button,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Ionicons
                          name="paper-plane"
                          size={19}
                          color={COLORS.navy}
                        />

                        <Text style={styles.buttonText}>
                          Continue with Telegram
                        </Text>

                        <Ionicons
                          name="arrow-forward"
                          size={18}
                          color={COLORS.navy}
                        />
                      </Pressable>
                    )}

                    {/* WAITING */}

                    {phase === 'waiting' && (
                      <>
                        <View style={styles.waitingRow}>
                          <ActivityIndicator
                            size="small"
                            color={COLORS.blue}
                          />

                          <Text style={styles.waitingText}>
                            Waiting for Telegram approval...
                          </Text>
                        </View>

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

              {/* FOOTER */}

              <View style={styles.footer}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={COLORS.navy}
                />

                <Text style={styles.footerText}>
                  Secure login · No password required
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}
