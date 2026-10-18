
import { useAuth } from '@/auth/AuthContext';
import { getTelegramLinkStatus } from '@/telegram/telegramLink';
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
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  navy: '#102C4B',
  text: '#17365A',
  muted: '#7691AA',
  blue: '#1789E8',
  sky: '#DDF2FF',
  yellow: '#FFD23F',
  white: '#FFFFFF',
  background: '#F7FBFF',
  border: '#E7EFF7',
  red: '#D84B4B',
  green: '#218C83',
};

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
            '../../assets/images/cars-hero.png'
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  hero: {
    height: 300,
    backgroundColor: COLORS.sky,
    overflow: 'hidden',
  },

  topbar: {
    height: 48,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 48,
    height: 44,
    justifyContent: 'center',
  },

  headerSpacer: {
    width: 48,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.navy,
  },

  heroContent: {
    marginTop: 28,
    marginHorizontal: 24,
    alignSelf: 'flex-start',
    padding: 15,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.86)',
  },

  heroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: COLORS.blue,
    marginBottom: 9,
  },

  heroTitle: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.navy,
  },

  content: {
    marginTop: -22,
    paddingTop: 1,
    paddingHorizontal: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: COLORS.background,
  },

  profileCard: {
    marginTop: -41,
    marginHorizontal: 4,
    paddingTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },

  avatarOuter: {
    width: 98,
    height: 98,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#DDF2FF',
    borderWidth: 3,
    borderColor: COLORS.white,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarInitials: {
    fontSize: 31,
    fontWeight: '800',
    color: COLORS.navy,
  },

  avatarCheck: {
    position: 'absolute',
    right: 0,
    bottom: 5,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  profileName: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: COLORS.navy,
    textAlign: 'center',
  },

  profileUsername: {
    marginTop: 5,
    fontSize: 14,
    color: COLORS.muted,
  },

  accountBadge: {
    marginTop: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#E9F7F2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  accountBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.green,
  },

  section: {
    marginTop: 26,
  },

  sectionTitle: {
    marginBottom: 12,
    marginLeft: 3,
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.navy,
  },

  detailsCard: {
    paddingHorizontal: 17,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  detailRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 12,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF7FD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailText: {
    flex: 1,
    gap: 5,
  },

  detailLabel: {
    fontSize: 12,
    color: COLORS.muted,
  },

  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.navy,
  },

  telegramCard: {
    padding: 16,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  telegramIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: '#249BDF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  telegramContent: {
    flex: 1,
    gap: 5,
  },

  telegramTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },

  telegramSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.muted,
  },

  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  sectionHint: {
    marginTop: 10,
    marginHorizontal: 4,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },

  signOutCard: {
    minHeight: 66,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  signOutIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#FFF0ED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  signOutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.red,
  },

  footer: {
    marginTop: 35,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: '#B3C7D8',
    textAlign: 'center',
  },
});
