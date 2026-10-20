import { COLORS, styles } from '@/app/(tabs)/_layout.styles';

import { Redirect, Tabs, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth/model/AuthContext';
import { ProfileMenuProvider } from '@/shared/ui/ProfileMenuContext';


import {
    createTelegramLink,
    disconnectTelegram,
    getTelegramLinkStatus,
    setTelegramNotifications,
    type TelegramLinkStatus,
} from '@/features/telegram/api/telegramLink';

import {
    Bell,
    BellOff,
    CarFront,
    CheckCircle2,
    Ellipsis,
    ExternalLink,
    House,
    LogOut,
    RefreshCw,
    Send,
    Unlink,
    Wrench
} from 'lucide-react-native';

import type { ReactNode } from 'react';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import {
    ActivityIndicator,
    Alert,
    AppState,
    Image,
    Linking,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    Switch,
    Text,
    View,
} from 'react-native';



function ProfileAvatar({
  photoUrl,
  initials,
  size = 36,
}: {
  photoUrl: string | null;
  initials: string;
  size?: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {photoUrl && !imageFailed ? (
        <Image
          source={{ uri: photoUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Text
          style={[
            styles.avatarInitials,
            { fontSize: size * 0.38 },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

function TabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: ReactNode;
}) {
  return (
    <View
      style={[
        styles.tabIconContainer,
        focused && styles.tabIconActive,
      ]}
    >
      {children}
    </View>
  );
}

export default function TabsLayout() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [telegramStatus, setTelegramStatus] =
    useState<TelegramLinkStatus | null>(null);

  const [telegramLoading, setTelegramLoading] =
    useState(false);

  const [telegramConnecting, setTelegramConnecting] =
    useState(false);

  const [telegramUpdating, setTelegramUpdating] =
    useState(false);

  const [telegramDisconnecting, setTelegramDisconnecting] =
    useState(false);

  const [disconnectConfirmOpen, setDisconnectConfirmOpen] =
    useState(false);

  const [telegramError, setTelegramError] =
    useState<string | null>(null);

  const requestVersion = useRef(0);
  const telegramBusy = useRef(false);

  const refreshTelegram = useCallback(async () => {
    if (!user) {
      setTelegramStatus(null);
      return;
    }

    if (telegramBusy.current) {
      return;
    }

    const version = ++requestVersion.current;

    setTelegramLoading(true);
    setTelegramError(null);

    try {
      const status = await getTelegramLinkStatus();

      if (version === requestVersion.current) {
        setTelegramStatus(status);
      }
    } catch (error) {
      if (version === requestVersion.current) {
        setTelegramError(
          error instanceof Error
            ? error.message
            : 'Unable to check Telegram connection',
        );
      }
    } finally {
      if (version === requestVersion.current) {
        setTelegramLoading(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (profileOpen && user) {
      void refreshTelegram();
    }
  }, [profileOpen, user?.id, refreshTelegram]);

  useEffect(() => {
    if (!profileOpen) {
      return;
    }

    const subscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          void refreshTelegram();
        }
      },
    );

    return () => subscription.remove();
  }, [profileOpen, refreshTelegram]);

  useEffect(() => {
    return () => {
      requestVersion.current += 1;
    };
  }, []);

  async function handleConnectTelegram() {
    if (telegramBusy.current) {
      return;
    }

    telegramBusy.current = true;
    setTelegramConnecting(true);
    setTelegramError(null);

    try {
      const result = await createTelegramLink();

      await Linking.openURL(result.url);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to connect Telegram';

      setTelegramError(message);

      if (Platform.OS !== 'web') {
        Alert.alert('Telegram', message);
      }
    } finally {
      telegramBusy.current = false;
      setTelegramConnecting(false);
    }
  }

  async function handleNotificationsChange(
    enabled: boolean,
  ) {
    if (
      telegramBusy.current ||
      !telegramStatus?.connected
    ) {
      return;
    }

    telegramBusy.current = true;
    requestVersion.current += 1;

    setTelegramUpdating(true);
    setTelegramLoading(false);
    setTelegramError(null);

    try {
      const status =
        await setTelegramNotifications(enabled);

      setTelegramStatus(status);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update Telegram notifications';

      setTelegramError(message);

      if (Platform.OS !== 'web') {
        Alert.alert('Telegram', message);
      }
    } finally {
      telegramBusy.current = false;
      setTelegramUpdating(false);
    }
  }

  async function handleDisconnectTelegram() {
    if (telegramBusy.current) {
      return;
    }

    telegramBusy.current = true;
    requestVersion.current += 1;

    setDisconnectConfirmOpen(false);
    setTelegramDisconnecting(true);
    setTelegramLoading(false);
    setTelegramError(null);

    try {
      const status = await disconnectTelegram();

      setTelegramStatus(status);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to disconnect Telegram';

      setTelegramError(message);

      if (Platform.OS !== 'web') {
        Alert.alert('Telegram', message);
      }
    } finally {
      telegramBusy.current = false;
      setTelegramDisconnecting(false);
    }
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();

      requestVersion.current += 1;

      setProfileOpen(false);
      setTelegramStatus(null);
      setTelegramError(null);

      router.replace('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={COLORS.blue}
        />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  const fullName = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  const displayName =
    fullName || user.username || 'Telegram user';

  const initials = (
    [
      user.firstName?.[0],
      user.lastName?.[0],
    ]
      .filter(Boolean)
      .join('') ||
    user.username?.[0] ||
    'U'
  ).toUpperCase();

  const tabOptions = (
    title: string,
    IconComponent: typeof House,
  ) => ({
    title,
    tabBarIcon: ({
      focused,
    }: {
      focused: boolean;
    }) => (
      <TabIcon focused={focused}>
        <IconComponent
          size={22}
          color={
            focused
              ? COLORS.navy
              : COLORS.muted
          }
          strokeWidth={focused ? 2.6 : 2}
        />
      </TabIcon>
    ),
  });

  const isBusy =
    telegramLoading ||
    telegramUpdating ||
    telegramConnecting ||
    telegramDisconnecting;

  return (
    <>
    <ProfileMenuProvider
    openProfile={() => setProfileOpen(true)}
  >
    
      <Tabs
        screenOptions={{
          headerRight: () => (
            <Pressable
              onPress={() => setProfileOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              style={styles.headerAvatarButton}
            >
              <ProfileAvatar
                photoUrl={user.photoUrl}
                initials={initials}
              />
            </Pressable>
          ),
          headerStyle: {
            backgroundColor: COLORS.white,
          },
          headerTitleStyle: {
            color: COLORS.navy,
            fontWeight: '800',
          },
          headerShadowVisible: false,
          tabBarActiveTintColor: COLORS.navy,
          tabBarInactiveTintColor: COLORS.muted,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabBarItem,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIconStyle: styles.tabBarIconStyle,
          tabBarHideOnKeyboard: true,
        }}
      >
        
      <Tabs.Screen
        name="index"
        options={{
          ...tabOptions(t('navigation.home'), House),
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="cars"
        options={tabOptions(
          t('navigation.cars'),
          CarFront,
        )}
      />

      <Tabs.Screen
        name="services"
        options={tabOptions(
          t('navigation.services'),
          Wrench,
        )}
      />

      <Tabs.Screen
        name="more"
        options={{
          ...tabOptions(t('navigation.more'), Ellipsis),
          headerShown: false,
        }}
      />

      <Tabs.Screen
        name="reminders"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />

    </Tabs>
  </ProfileMenuProvider>

      <Modal
        visible={profileOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!disconnectConfirmOpen) {
            setProfileOpen(false);
          }
        }}
      >
        <SafeAreaView style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() => {
              if (!disconnectConfirmOpen) {
                setProfileOpen(false);
              }
            }}
            accessibilityLabel="Close profile"
          />

          <View style={styles.popup}>
            <View style={styles.profileHeader}>
              <ProfileAvatar
                photoUrl={user.photoUrl}
                initials={initials}
                size={56}
              />

              <View style={styles.profileInfo}>
                <Text
                  style={styles.profileName}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>

                <Text
                  style={styles.profileUsername}
                  numberOfLines={1}
                >
                  {user.username
                    ? `@${user.username}`
                    : 'Telegram account'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Send
                  size={18}
                  color={COLORS.blue}
                />

                <Text style={styles.sectionTitle}>
                  Telegram notifications
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  void refreshTelegram()
                }
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel="Refresh Telegram status"
              >
                <RefreshCw
                  size={17}
                  color={
                    isBusy
                      ? COLORS.border
                      : COLORS.muted
                  }
                />
              </Pressable>
            </View>

            {telegramLoading ? (
              <View style={styles.statusRow}>
                <ActivityIndicator
                  size="small"
                  color={COLORS.blue}
                />

                <Text style={styles.statusMuted}>
                  Checking connection...
                </Text>
              </View>
            ) : telegramStatus?.connected ? (
              <>
                <View style={styles.connectedBox}>
                  <View style={styles.statusRow}>
                    <CheckCircle2
                      size={19}
                      color={COLORS.green}
                    />

                    <Text style={styles.connectedText}>
                      Telegram connected
                    </Text>
                  </View>
                </View>

                <View style={styles.notificationRow}>
                  <View style={styles.notificationInfo}>
                    <View style={styles.notificationTitleRow}>
                      {telegramStatus.notificationsEnabled ? (
                        <Bell
                          size={17}
                          color={COLORS.blue}
                        />
                      ) : (
                        <BellOff
                          size={17}
                          color={COLORS.muted}
                        />
                      )}

                      <Text style={styles.notificationTitle}>
                        Maintenance reminders
                      </Text>
                    </View>

                    <Text style={styles.notificationDescription}>
                      {telegramStatus.notificationsEnabled
                        ? 'Notifications enabled'
                        : 'Notifications disabled'}
                    </Text>
                  </View>

                  {telegramUpdating ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.blue}
                    />
                  ) : (
                    <Switch
                      value={
                        telegramStatus.notificationsEnabled
                      }
                      onValueChange={(value) =>
                        void handleNotificationsChange(
                          value,
                        )
                      }
                      disabled={isBusy}
                      trackColor={{
                        false: '#D4E0E9',
                        true: '#9ADCC0',
                      }}
                      thumbColor={
                        telegramStatus.notificationsEnabled
                          ? COLORS.green
                          : '#F5F7F9'
                      }
                      ios_backgroundColor="#D4E0E9"
                      accessibilityLabel="Maintenance reminders"
                    />
                  )}
                </View>

                <Pressable
                  style={[
                    styles.disconnectButton,
                    isBusy && styles.disabledButton,
                  ]}
                  onPress={() =>
                    setDisconnectConfirmOpen(true)
                  }
                  disabled={isBusy}
                  accessibilityRole="button"
                >
                  {telegramDisconnecting ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.red}
                    />
                  ) : (
                    <>
                      <Unlink
                        size={16}
                        color={COLORS.red}
                      />

                      <Text style={styles.disconnectText}>
                        Disconnect Telegram
                      </Text>
                    </>
                  )}
                </Pressable>
              </>
            ) : (
              <View>
                <Text style={styles.statusDescription}>
                  Connect Telegram to receive maintenance
                  reminders for your vehicles.
                </Text>

                <Pressable
                  style={[
                    styles.connectButton,
                    isBusy && styles.disabledButton,
                  ]}
                  onPress={() =>
                    void handleConnectTelegram()
                  }
                  disabled={isBusy}
                  accessibilityRole="button"
                >
                  {telegramConnecting ? (
                    <ActivityIndicator
                      color={COLORS.white}
                    />
                  ) : (
                    <>
                      <Send
                        size={17}
                        color={COLORS.white}
                      />

                      <Text style={styles.connectText}>
                        Connect Telegram
                      </Text>

                      <ExternalLink
                        size={15}
                        color={COLORS.white}
                      />
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {telegramError ? (
              <Text style={styles.errorText}>
                {telegramError}
              </Text>
            ) : null}

            <View style={styles.divider} />

            <Pressable
              style={[
                styles.logoutButton,
                loggingOut && styles.disabledButton,
              ]}
              onPress={() =>
                void handleLogout()
              }
              disabled={loggingOut}
              accessibilityRole="button"
            >
              {loggingOut ? (
                <ActivityIndicator
                  color={COLORS.red}
                />
              ) : (
                <>
                  <LogOut
                    size={18}
                    color={COLORS.red}
                  />

                  <Text style={styles.logoutText}>
                    Log out
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {disconnectConfirmOpen && (
            <View style={styles.confirmOverlay}>
              <View style={styles.confirmCard}>
                <View style={styles.confirmIcon}>
                  <Unlink
                    size={24}
                    color={COLORS.red}
                  />
                </View>

                <Text style={styles.confirmTitle}>
                  Disconnect Telegram?
                </Text>

                <Text style={styles.confirmDescription}>
                  You will stop receiving Telegram
                  maintenance reminders until you
                  reconnect your account.
                </Text>

                <Pressable
                  style={styles.confirmDisconnectButton}
                  onPress={() =>
                    void handleDisconnectTelegram()
                  }
                >
                  <Text style={styles.confirmDisconnectText}>
                    Disconnect
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.cancelButton}
                  onPress={() =>
                    setDisconnectConfirmOpen(false)
                  }
                >
                  <Text style={styles.cancelText}>
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}
