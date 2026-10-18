
import { router, Stack } from 'expo-router';
import {
    ChevronRight,
    CircleHelp,
    Send,
    Settings,
    UserRound,
    X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
    ImageBackground,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfileMenu } from '@/components/ProfileMenuContext';

const COLORS = {
  navy: '#102C4B',
  muted: '#7793AF',
  sky: '#DDF2FF',
  white: '#FFFFFF',
  divider: '#EAF0F6',
  blue: '#1789E8',
};

type InfoPanel = 'settings' | 'help' | null;

type MenuItemProps = {
  title: string;
  icon: typeof UserRound;
  onPress: () => void;
  last?: boolean;
};

function MenuItem({
  title,
  icon: Icon,
  onPress,
  last = false,
}: MenuItemProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
    >
      <View style={styles.iconContainer}>
        <Icon
          size={22}
          strokeWidth={2.1}
          color={COLORS.navy}
        />
      </View>

      <View
        style={[
          styles.menuItemContent,
          last && styles.lastItem,
        ]}
      >
        <Text style={styles.menuItemText}>
          {title}
        </Text>

        <ChevronRight
          size={21}
          strokeWidth={2}
          color="#A9BED3"
        />
      </View>
    </Pressable>
  );
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { openProfile } = useProfileMenu();

  const [panel, setPanel] =
    useState<InfoPanel>(null);

  const closePanel = () => setPanel(null);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ImageBackground
        source={require(
          '../../../assets/images/lovablecar-main-background.png'
        )}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 15,
              paddingBottom: insets.bottom + 30,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            More
          </Text>

          <View style={styles.menuCard}>
            <MenuItem
              title="Profile"
              icon={UserRound}
              onPress={() => router.push('/profile')}
            />

            <MenuItem
              title="Settings"
              icon={Settings}
              onPress={() =>
                setPanel('settings')
              }
            />

            <MenuItem
              title="Telegram Notifications"
              icon={Send}
              onPress={openProfile}
            />

            <MenuItem
              title="Help & Support"
              icon={CircleHelp}
              onPress={() =>
                setPanel('help')
              }
              last
            />
          </View>
        </ScrollView>
      </ImageBackground>

      <Modal
        visible={panel !== null}
        transparent
        animationType="fade"
        onRequestClose={closePanel}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closePanel}
            accessibilityLabel="Close dialog"
          />

          <View style={styles.modalCard}>
            <Pressable
              style={styles.closeButton}
              onPress={closePanel}
              accessibilityLabel="Close"
            >
              <X
                size={20}
                color={COLORS.navy}
              />
            </Pressable>

            <View style={styles.modalIcon}>
              {panel === 'settings' ? (
                <Settings
                  size={28}
                  color={COLORS.blue}
                />
              ) : (
                <CircleHelp
                  size={28}
                  color={COLORS.blue}
                />
              )}
            </View>

            <Text style={styles.modalTitle}>
              {panel === 'settings'
                ? 'Settings'
                : 'Help & Support'}
            </Text>

            <Text style={styles.modalDescription}>
              {panel === 'settings'
                ? 'Additional application settings will be available here in a future update.'
                : 'Help and support options will be available here in a future update.'}
            </Text>

            <Pressable
              style={styles.modalButton}
              onPress={closePanel}
            >
              <Text style={styles.modalButtonText}>
                Got it
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.sky,
  },

  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.9,
    color: COLORS.navy,
    marginBottom: 17,
    marginLeft: 2,
  },

  menuCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 19,
    overflow: 'hidden',
  },

  menuItem: {
    minHeight: 55,
    paddingLeft: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuItemPressed: {
    backgroundColor: '#EFF7FD',
  },

  iconContainer: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  menuItemContent: {
    flex: 1,
    minHeight: 55,
    paddingRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
  },

  lastItem: {
    borderBottomWidth: 0,
  },

  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.navy,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9,39,71,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  modalCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },

  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  modalIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#EAF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 17,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.navy,
    textAlign: 'center',
  },

  modalDescription: {
    marginTop: 11,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
    textAlign: 'center',
  },

  modalButton: {
    width: '100%',
    height: 49,
    borderRadius: 15,
    backgroundColor: '#FFD23F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 23,
  },

  modalButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.navy,
  },
});
