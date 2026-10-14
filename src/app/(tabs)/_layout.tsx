
import { useAuth } from '@/auth/AuthContext';
import { Redirect, Tabs, useRouter } from 'expo-router';
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

export default function TabsLayout() {
  const router = useRouter();

  const { user, loading, logout } = useAuth();

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" />
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
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  }

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

  return (
    <>
      <Tabs
        screenOptions={{
          headerRight: profileButton,
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTitleStyle: {
            color: '#172033',
            fontWeight: '700',
          },
          tabBarActiveTintColor: '#0088CC',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
          }}
        />

        <Tabs.Screen
          name="cars"
          options={{
            title: 'Cars',
          }}
        />

        <Tabs.Screen
          name="services"
          options={{
            title: 'Service',
          }}
        />

        <Tabs.Screen
          name="reminders"
          options={{
            title: 'Reminders',
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
      </Tabs>

      <Modal
        visible={profileOpen}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setProfileOpen(false)
        }
      >
        <SafeAreaView style={styles.modalRoot}>
          <Pressable
            style={styles.backdrop}
            onPress={() =>
              setProfileOpen(false)
            }
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

                {user.username ? (
                  <Text
                    style={styles.profileUsername}
                    numberOfLines={1}
                  >
                    @{user.username}
                  </Text>
                ) : (
                  <Text
                    style={styles.profileUsername}
                  >
                    Telegram account
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <Pressable
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={loggingOut}
              accessibilityRole="button"
            >
              {loggingOut ? (
                <ActivityIndicator
                  color="#C62828"
                />
              ) : (
                <Text style={styles.logoutText}>
                  Log out
                </Text>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F9',
  },

  headerAvatarButton: {
    marginRight: 16,
    padding: 4,
  },

  avatar: {
    backgroundColor: '#DDF1FB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarInitials: {
    color: '#0088CC',
    fontWeight: '800',
  },

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-start',
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },

  popup: {
    position: 'absolute',
    top: 65,
    right: 16,
    width: 290,
    maxWidth: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
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
    fontWeight: '700',
    color: '#172033',
  },

  profileUsername: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },

  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },

  logoutText: {
    color: '#C62828',
    fontSize: 15,
    fontWeight: '700',
  },
});
