
import { useAuth } from '@/auth/AuthContext';

import {
    Redirect,
    Tabs,
    useRouter,
} from 'expo-router';

import {
    Bell,
    CarFront,
    House,
    LogOut,
    Settings2,
    Wrench,
} from 'lucide-react-native';

import type { ReactNode } from 'react';
import { useState } from 'react';

import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

// =====================================
// COLORS
// =====================================

const COLORS = {
  navy: '#092747',
  blue: '#1476C8',
  muted: '#7893AA',
  yellow: '#FFCC32',
  white: '#FFFFFF',
  border: '#E0EDF6',
  red: '#C62828',
};

// =====================================
// PROFILE AVATAR
// =====================================

function ProfileAvatar({
  photoUrl,
  initials,
  size = 36,
}: {
  photoUrl: string | null;
  initials: string;
  size?: number;
}) {
  const [imageFailed, setImageFailed] =
    useState(false);

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
            {
              fontSize: size * 0.38,
            },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}

// =====================================
// ORIGINAL TAB ICON COMPONENT
// =====================================

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

// =====================================
// MAIN TABS LAYOUT
// =====================================

export default function TabsLayout() {
  const router = useRouter();

  const { user, loading, logout } = useAuth();

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  // =====================================
  // AUTHENTICATION LOADING
  // =====================================

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

  // =====================================
  // USER INFORMATION
  // =====================================

  const fullName = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  const displayName =
    fullName ||
    user.username ||
    'Telegram user';

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

  // =====================================
  // LOGOUT
  // =====================================

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();

      setProfileOpen(false);

      router.replace('/login');
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );
    } finally {
      setLoggingOut(false);
    }
  }

  // =====================================
  // HEADER PROFILE BUTTON
  // =====================================

  const profileButton = () => (
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
  );

  // =====================================
  // RENDER
  // =====================================

  return (
    <>
      <Tabs
        screenOptions={{
          headerRight: profileButton,

          headerStyle: {
            backgroundColor: COLORS.white,
          },

          headerTitleStyle: {
            color: COLORS.navy,
            fontWeight: '800',
          },

          headerShadowVisible: false,

          tabBarActiveTintColor:
            COLORS.navy,

          tabBarInactiveTintColor:
            COLORS.muted,

          tabBarStyle: styles.tabBar,

          tabBarItemStyle:
            styles.tabBarItem,

          tabBarLabelStyle:
            styles.tabBarLabel,

          tabBarIconStyle:
            styles.tabBarIconStyle,

          tabBarHideOnKeyboard: true,
        }}
      >
        {/* ===========================
            HOME
        =========================== */}

        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,

            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused}>
                <House
                  size={22}
                  color={
                    focused
                      ? COLORS.navy
                      : COLORS.muted
                  }
                  strokeWidth={
                    focused ? 2.6 : 2
                  }
                />
              </TabIcon>
            ),
          }}
        />

        {/* ===========================
            CARS
        =========================== */}

        <Tabs.Screen
          name="cars"
          options={{
            title: 'Cars',

            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused}>
                <CarFront
                  size={23}
                  color={
                    focused
                      ? COLORS.navy
                      : COLORS.muted
                  }
                  strokeWidth={
                    focused ? 2.6 : 2
                  }
                />
              </TabIcon>
            ),
          }}
        />

        {/* ===========================
            SERVICE
        =========================== */}

        <Tabs.Screen
          name="services"
          options={{
            title: 'Service',

            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused}>
                <Wrench
                  size={22}
                  color={
                    focused
                      ? COLORS.navy
                      : COLORS.muted
                  }
                  strokeWidth={
                    focused ? 2.6 : 2
                  }
                />
              </TabIcon>
            ),
          }}
        />

        {/* ===========================
            REMINDERS
        =========================== */}

        <Tabs.Screen
          name="reminders"
          options={{
            title: 'Reminders',

            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused}>
                <Bell
                  size={22}
                  color={
                    focused
                      ? COLORS.navy
                      : COLORS.muted
                  }
                  strokeWidth={
                    focused ? 2.6 : 2
                  }
                />
              </TabIcon>
            ),
          }}
        />

        {/* ===========================
            SETTINGS
        =========================== */}

        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',

            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused}>
                <Settings2
                  size={22}
                  color={
                    focused
                      ? COLORS.navy
                      : COLORS.muted
                  }
                  strokeWidth={
                    focused ? 2.6 : 2
                  }
                />
              </TabIcon>
            ),
          }}
        />
      </Tabs>

      {/* =====================================
          TELEGRAM PROFILE MODAL
      ===================================== */}

      <Modal
        visible={profileOpen}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setProfileOpen(false)
        }
      >
        <SafeAreaView
          style={styles.modalRoot}
        >
          {/* Backdrop */}

          <Pressable
            style={styles.backdrop}
            onPress={() =>
              setProfileOpen(false)
            }
            accessibilityLabel="Close profile"
          />

          {/* Profile Popup */}

          <View style={styles.popup}>
            <View
              style={styles.profileHeader}
            >
              <ProfileAvatar
                photoUrl={user.photoUrl}
                initials={initials}
                size={56}
              />

              <View
                style={styles.profileInfo}
              >
                <Text
                  style={styles.profileName}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>

                {user.username ? (
                  <Text
                    style={
                      styles.profileUsername
                    }
                    numberOfLines={1}
                  >
                    @{user.username}
                  </Text>
                ) : (
                  <Text
                    style={
                      styles.profileUsername
                    }
                  >
                    Telegram account
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Logout Button */}

            <Pressable
              style={[
                styles.logoutButton,

                loggingOut &&
                  styles.logoutButtonDisabled,
              ]}
              onPress={handleLogout}
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
                    strokeWidth={2}
                  />

                  <Text
                    style={styles.logoutText}
                  >
                    Log out
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

// =====================================
// STYLES
// =====================================

const styles = StyleSheet.create({
  // =====================================
  // LOADING
  // =====================================

  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F9',
  },

  // =====================================
  // BOTTOM NAVIGATION
  // =====================================

  tabBar: {
    backgroundColor: COLORS.white,

    borderTopWidth: 1,
    borderTopColor: COLORS.border,

    height: 78,

    paddingTop: 6,
    paddingBottom: 12,
    paddingHorizontal: 8,

    shadowColor: COLORS.navy,
    shadowOpacity: 0.06,
    shadowRadius: 10,

    shadowOffset: {
      width: 0,
      height: -3,
    },

    elevation: 6,
  },

  tabBarItem: {
    paddingTop: 0,
  },

  tabBarIconStyle: {
    marginBottom: 0,
  },

  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  // =====================================
  // ACTIVE TAB DESIGN
  // =====================================

  tabIconContainer: {
    width: 48,
    height: 42,

    borderRadius: 14,

    alignItems: 'center',
    justifyContent: 'center',
  },

  tabIconActive: {
    // backgroundColor: COLORS.yellow,
  },

  // =====================================
  // PROFILE AVATAR
  // =====================================

  headerAvatarButton: {
    marginRight: 16,
    padding: 4,
  },

  avatar: {
    backgroundColor: '#DDF1FB',

    alignItems: 'center',
    justifyContent: 'center',

    overflow: 'hidden',

    borderWidth: 1,
    borderColor: '#D2E9F7',
  },

  avatarInitials: {
    color: COLORS.blue,
    fontWeight: '800',
  },

  // =====================================
  // PROFILE MODAL
  // =====================================

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor:
      'rgba(9, 39, 71, 0.42)',
  },

  popup: {
    position: 'absolute',

    top: 65,
    right: 16,

    width: 290,
    maxWidth: '90%',

    backgroundColor: COLORS.white,

    borderRadius: 20,
    padding: 18,

    shadowColor: COLORS.navy,
    shadowOpacity: 0.16,
    shadowRadius: 18,

    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 10,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },

  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.navy,
  },

  profileUsername: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.muted,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },

  // =====================================
  // LOGOUT BUTTON
  // =====================================

  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,

    borderRadius: 12,

    backgroundColor: '#FFF0F0',

    alignItems: 'center',
    justifyContent: 'center',

    flexDirection: 'row',
    gap: 9,
  },

  logoutButtonDisabled: {
    opacity: 0.6,
  },

  logoutText: {
    color: COLORS.red,
    fontSize: 15,
    fontWeight: '800',
  },
});
