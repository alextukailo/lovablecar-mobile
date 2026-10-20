
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import {
    openTelegramLogin,
    startMobileLogin,
} from '../auth/mobileLogin';

type Props = {
  navigation: {
    navigate: (screen: string) => void;
  };
};

const COLORS = {
  navy: '#102647',
  blue: '#41668B',
  sky: '#EAF6FF',
  white: '#FFFFFF',
  yellow: '#FFD33F',
  text: '#243B53',
  muted: '#7D91A5',
  border: '#DCEAF5',
};

export default function LoginScreen({
  navigation,
}: Props) {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const login = await startMobileLogin();

      await openTelegramLogin(
        login.transactionId,
        login.browserState,
      );

      navigation.navigate('TelegramWaiting');
    } catch (error) {
      Alert.alert(
        'Login failed',
        error instanceof Error
          ? error.message
          : 'Please try again',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* BRAND */}

        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Ionicons
              name="car-sport"
              size={24}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.brandName}>
            Lovable
            <Text style={styles.brandAccent}>Car</Text>
          </Text>
        </View>

        {/* HERO */}

        <ImageBackground
          source={require('../../../assets/images/cars-hero.png')}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode="cover"
        >
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons
                name="sparkles"
                size={13}
                color={COLORS.navy}
              />

              <Text style={styles.heroBadgeText}>
                YOUR DIGITAL GARAGE
              </Text>
            </View>

            <Text style={styles.heroTitle}>
              Your car.
              {'\n'}
              All under
              {'\n'}
              control.
            </Text>

            <Text style={styles.heroSubtitle}>
              Everything your car needs,
              {'\n'}
              in one beautiful place.
            </Text>
          </View>
        </ImageBackground>

        {/* LOGIN CARD */}

        <View style={styles.loginCard}>
          <View style={styles.welcomeIcon}>
            <Ionicons
              name="hand-left-outline"
              size={23}
              color={COLORS.navy}
            />
          </View>

          <Text style={styles.title}>
            Welcome to LovableCar
          </Text>

          <Text style={styles.subtitle}>
            Sign in to manage your vehicles,
            track maintenance and never miss
            an important service.
          </Text>

          {/* FEATURES */}

          <View style={styles.features}>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name="car-outline"
                  size={18}
                  color={COLORS.blue}
                />
              </View>

              <Text style={styles.featureText}>
                Your vehicles in one place
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={COLORS.blue}
                />
              </View>

              <Text style={styles.featureText}>
                Smart maintenance reminders
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={COLORS.blue}
                />
              </View>

              <Text style={styles.featureText}>
                Complete service history
              </Text>
            </View>
          </View>

          {/* TELEGRAM BUTTON */}

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Continue with Telegram"
            style={({ pressed }) => [
              styles.loginButton,
              (pressed || loading) &&
                styles.loginButtonPressed,
            ]}
          >
            {loading ? (
              <ActivityIndicator
                color={COLORS.navy}
              />
            ) : (
              <>
                <Ionicons
                  name="paper-plane"
                  size={20}
                  color={COLORS.navy}
                />

                <Text style={styles.loginButtonText}>
                  Continue with Telegram
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color={COLORS.navy}
                />
              </>
            )}
          </Pressable>

          <Text style={styles.loginHint}>
            No password needed. Just your Telegram account.
          </Text>
        </View>

        {/* SECURITY */}

        <View style={styles.securityRow}>
          <View style={styles.securityItem}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={COLORS.blue}
            />

            <Text style={styles.securityText}>
              Secure sign in
            </Text>
          </View>

          <View style={styles.securityDivider} />

          <View style={styles.securityItem}>
            <Ionicons
              name="flash-outline"
              size={16}
              color={COLORS.blue}
            />

            <Text style={styles.securityText}>
              Quick setup
            </Text>
          </View>
        </View>

        {/* FOOTER */}

        <Text style={styles.footer}>
          Made for people who love their cars.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.sky,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.sky,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 32,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  // BRAND

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 22,
  },

  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandName: {
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: -0.8,
  },

  brandAccent: {
    color: COLORS.blue,
  },

  // HERO

  hero: {
    height: 255,
    backgroundColor: '#C6E8FC',
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 18,
    justifyContent: 'flex-start',
  },

  heroImage: {
    borderRadius: 26,
  },

  heroContent: {
    flex: 1,
    padding: 22,
    alignItems: 'flex-start',
  },

  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.yellow,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 15,
  },

  heroBadgeText: {
    color: COLORS.navy,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  heroTitle: {
    fontSize: 31,
    lineHeight: 35,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: -1,
  },

  heroSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    color: COLORS.blue,
    marginTop: 11,
  },

  // LOGIN CARD

  loginCard: {
    backgroundColor: COLORS.white,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: '#F1F6FB',
    shadowColor: COLORS.navy,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },

  welcomeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF5C9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  title: {
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.7,
    color: COLORS.navy,
  },

  subtitle: {
    fontSize: 13,
    lineHeight: 21,
    color: COLORS.muted,
    marginTop: 9,
  },

  // FEATURES

  features: {
    marginTop: 23,
    marginBottom: 24,
    gap: 14,
  },

  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  // BUTTON

  loginButton: {
    minHeight: 58,
    backgroundColor: COLORS.yellow,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 14,
  },

  loginButtonPressed: {
    opacity: 0.7,
  },

  loginButtonText: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
  },

  loginHint: {
    marginTop: 13,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.muted,
    textAlign: 'center',
  },

  // SECURITY

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 17,
    marginTop: 25,
  },

  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  securityText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: '600',
  },

  securityDivider: {
    width: 1,
    height: 15,
    backgroundColor: COLORS.border,
  },

  footer: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.muted,
  },
});
