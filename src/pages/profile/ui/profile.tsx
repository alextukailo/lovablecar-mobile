import { COLORS, styles } from '@/pages/profile/ui/profile.styles';

import { useAuth } from '@/features/auth/model/AuthContext';
import { getTelegramLinkStatus } from '@/features/telegram/api/telegramLink';
import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import {
    ArrowLeft,
    AtSign,
    CheckCircle2,
    ChevronRight,
    CircleUserRound,
    Hash,
    LogOut,
    Send,
    ShieldCheck,
    UserRound,
} from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



function ProfileAvatar({
  photoUrl,
  initials,
}: {
  photoUrl: string | null;
  initials: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <View style={styles.avatarOuter}>
      <View style={styles.avatar}>
        {photoUrl && !imageFailed ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.avatarImage}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Text style={styles.avatarInitials}>
            {initials}
          </Text>
        )}
      </View>

      <View style={styles.avatarCheck}>
        <CheckCircle2
          size={22}
          color={COLORS.white}
          fill={COLORS.blue}
        />
      </View>
    </View>
  );
}

function SectionTitle({
  children,
}: {
  children: string;
}) {
  return (
    <Text style={styles.sectionTitle}>
      {children}
    </Text>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  last = false,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailRow,
        !last && styles.rowDivider,
      ]}
    >
      <View style={styles.detailIcon}>
        <Icon
          size={20}
          color={COLORS.navy}
          strokeWidth={1.9}
        />
      </View>

      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>
          {label}
        </Text>

        <Text
          style={styles.detailValue}
          selectable
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [loggingOut, setLoggingOut] =
    useState(false);

  const {
    data: telegramStatus,
    isLoading: telegramLoading,
  } = useQuery({
    queryKey: ['telegram', 'link', 'status'],
    queryFn: getTelegramLinkStatus,
    enabled: Boolean(user),
    retry: 1,
  });

  const firstName = user?.firstName?.trim() || '';
  const lastName = user?.lastName?.trim() || '';

  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    user?.username ||
    'LovableCar User';

  const initials =
    [firstName[0], lastName[0]]
      .filter(Boolean)
      .join('')
      .toUpperCase() ||
    fullName.slice(0, 2).toUpperCase();

  const username = user?.username
    ? `@${user.username.replace(/^@/, '')}`
    : 'Not specified';

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSignOut = () => {
    if (loggingOut) return;

    Alert.alert(
      'Sign out?',
      'You will need to sign in again to access your cars and services.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);

            try {
              await logout();
              router.replace('/login');
            } catch {
              Alert.alert(
                'Unable to sign out',
                'Please try again.',
              );
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{ headerShown: false }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom:
            Math.max(insets.bottom, 16) + 28,
        }}
      >
        {/* SCENIC HEADER */}

        <ImageBackground
          source={require(
            '../../../../assets/images/cars-hero.png'
          )}
          resizeMode="cover"
          style={[
            styles.hero,
            { paddingTop: insets.top + 8 },
          ]}
        >
          <View style={styles.topbar}>
            <Pressable
              onPress={goBack}
              style={styles.backButton}
              accessibilityLabel="Go back"
            >
              <ArrowLeft
                size={24}
                color={COLORS.navy}
              />
            </Pressable>

            <Text style={styles.headerTitle}>
              My Profile
            </Text>

            <View style={styles.headerSpacer} />
          </View>
        </ImageBackground>

        {/* PROFILE CONTENT */}

        <View style={styles.content}>
          {/* PROFILE CARD */}

          <View style={styles.profileCard}>
            <ProfileAvatar
              photoUrl={user?.photoUrl || null}
              initials={initials}
            />

            <Text
              style={styles.profileName}
              numberOfLines={2}
            >
              {fullName}
            </Text>

            <Text style={styles.profileUsername}>
              {user?.username
                ? username
                : 'LovableCar member'}
            </Text>

            <View style={styles.accountBadge}>
              <ShieldCheck
                size={15}
                color={COLORS.green}
              />

              <Text style={styles.accountBadgeText}>
                Signed in with Telegram
              </Text>
            </View>
          </View>

          {/* PERSONAL INFORMATION */}

          <View style={styles.section}>
            <SectionTitle>
              Personal Information
            </SectionTitle>

            <View style={styles.detailsCard}>
              <DetailRow
                icon={UserRound}
                label="First name"
                value={firstName || 'Not specified'}
              />

              <DetailRow
                icon={CircleUserRound}
                label="Last name"
                value={lastName || 'Not specified'}
              />

              <DetailRow
                icon={AtSign}
                label="Telegram username"
                value={username}
              />

              <DetailRow
                icon={Hash}
                label="Telegram ID"
                value={
                  user?.telegramUserId ||
                  'Not available'
                }
                last
              />
            </View>
          </View>

          {/* TELEGRAM */}

          <View style={styles.section}>
            <SectionTitle>
              Connected Services
            </SectionTitle>

            <View style={styles.telegramCard}>
              <View style={styles.telegramIcon}>
                <Send
                  size={24}
                  color={COLORS.white}
                  fill={COLORS.white}
                />
              </View>

              <View style={styles.telegramContent}>
                <Text style={styles.telegramTitle}>
                  Telegram
                </Text>

                <Text style={styles.telegramSubtitle}>
                  {telegramLoading
                    ? 'Checking connection...'
                    : telegramStatus?.connected
                      ? telegramStatus.notificationsEnabled
                        ? 'Maintenance alerts enabled'
                        : 'Connected · Alerts disabled'
                      : 'Not connected for alerts'}
                </Text>
              </View>

              {telegramLoading ? (
                <ActivityIndicator
                  color={COLORS.blue}
                  size="small"
                />
              ) : (
                <View
                  style={[
                    styles.connectionDot,
                    {
                      backgroundColor:
                        telegramStatus?.connected
                          ? COLORS.green
                          : '#C1CEDA',
                    },
                  ]}
                />
              )}
            </View>

            <Text style={styles.sectionHint}>
              Manage Telegram linking and maintenance
              notifications from the account menu.
            </Text>
          </View>

          {/* ACCOUNT */}

          <View style={styles.section}>
            <SectionTitle>
              Account
            </SectionTitle>

            <Pressable
              onPress={handleSignOut}
              disabled={loggingOut}
              style={({ pressed }) => [
                styles.signOutCard,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.signOutIcon}>
                {loggingOut ? (
                  <ActivityIndicator
                    color={COLORS.red}
                  />
                ) : (
                  <LogOut
                    size={20}
                    color={COLORS.red}
                  />
                )}
              </View>

              <Text style={styles.signOutText}>
                Sign Out
              </Text>

              <ChevronRight
                size={20}
                color="#A9BED3"
              />
            </Pressable>
          </View>

          <Text style={styles.footer}>
            LovableCar
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
