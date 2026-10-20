
import { router, Stack } from 'expo-router';
import {
    Check,
    ChevronRight,
    CircleHelp,
    Globe2,
    Send,
    Settings,
    UserRound,
    X,
} from 'lucide-react-native';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
    ActivityIndicator,
    Alert,
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

import {
    getAppLanguage,
    setAppLanguage,
    type AppLanguage,
} from '@/i18n';

const C = {
  navy: '#102C4B',
  muted: '#7793AF',
  sky: '#DDF2FF',
  white: '#FFFFFF',
  divider: '#EAF0F6',
  blue: '#1789E8',
  yellow: '#FFD23F',
};

type Panel = 'settings' | 'help' | null;

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
        pressed && styles.menuPressed,
      ]}
    >
      <View style={styles.iconBox}>
        <Icon
          size={22}
          strokeWidth={2}
          color={C.navy}
        />
      </View>

      <View
        style={[
          styles.menuContent,
          last && styles.lastItem,
        ]}
      >
        <Text style={styles.menuText}>
          {title}
        </Text>

        <ChevronRight
          size={21}
          color="#A9BED3"
          strokeWidth={2}
        />
      </View>
    </Pressable>
  );
}

type LanguageOptionProps = {
  language: AppLanguage;
  title: string;
  subtitle: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
};

function LanguageOption({
  language,
  title,
  subtitle,
  selected,
  disabled,
  onPress,
}: LanguageOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{
        selected,
        disabled,
      }}
      style={({ pressed }) => [
        styles.languageOption,
        selected && styles.languageSelected,
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={styles.flagBox}>
        <Text style={styles.flag}>
          {language === 'en' ? '🇬🇧' : '🇷🇺'}
        </Text>
      </View>

      <View style={styles.languageText}>
        <Text style={styles.languageTitle}>
          {title}
        </Text>

        <Text style={styles.languageSubtitle}>
          {subtitle}
        </Text>
      </View>

      <View
        style={[
          styles.radio,
          selected && styles.radioSelected,
        ]}
      >
        {selected && (
          <Check
            size={14}
            strokeWidth={3}
            color={C.white}
          />
        )}
      </View>
    </Pressable>
  );
}

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { openProfile } = useProfileMenu();
  const { t } = useTranslation();

  const [panel, setPanel] = useState<Panel>(null);
  const [savingLanguage, setSavingLanguage] =
    useState(false);

  const currentLanguage = getAppLanguage();

  const closePanel = () => {
    if (!savingLanguage) {
      setPanel(null);
    }
  };

  const changeLanguage = async (
    language: AppLanguage,
  ) => {
    if (
      savingLanguage ||
      language === getAppLanguage()
    ) {
      return;
    }

    setSavingLanguage(true);

    try {
      await setAppLanguage(language);
    } catch (error) {
      console.error(
        '[Settings] Language change failed:',
        error,
      );

      Alert.alert(
        'Language',
        'Could not save your language preference.',
      );
    } finally {
      setSavingLanguage(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{ headerShown: false }}
      />

      <ImageBackground
        source={require(
          '../../../assets/images/lovablecar-main-background.png'
        )}
        style={styles.background}
        resizeMode="cover"
        blurRadius={18}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 15,
              paddingBottom: insets.bottom + 30,
            },
          ]}
        >
          <Text style={styles.title}>
            {t('more.title')}
          </Text>

          <View style={styles.menuCard}>
            <MenuItem
              title={t('more.profile')}
              icon={UserRound}
              onPress={() => router.push('/profile')}
            />

            <MenuItem
              title={t('more.settings')}
              icon={Settings}
              onPress={() => setPanel('settings')}
            />

            <MenuItem
              title={t('more.telegramNotifications')}
              icon={Send}
              onPress={openProfile}
            />

            <MenuItem
              title={t('more.helpSupport')}
              icon={CircleHelp}
              onPress={() => setPanel('help')}
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
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closePanel}
            disabled={savingLanguage}
          />

          <View style={styles.modalCard}>
            <Pressable
              style={styles.closeButton}
              onPress={closePanel}
              disabled={savingLanguage}
            >
              <X size={20} color={C.navy} />
            </Pressable>

            <View style={styles.modalIcon}>
              {panel === 'settings' ? (
                <Settings size={28} color={C.blue} />
              ) : (
                <CircleHelp size={28} color={C.blue} />
              )}
            </View>

            <Text style={styles.modalTitle}>
              {panel === 'settings'
                ? t('settings.title')
                : t('more.helpSupport')}
            </Text>

            {panel === 'settings' ? (
              <View style={styles.settingsContent}>
                <Text style={styles.modalDescription}>
                  {t('settings.languageDescription')}
                </Text>

                <View style={styles.sectionHeader}>
                  <Globe2 size={18} color={C.blue} />
                  <Text style={styles.sectionLabel}>
                    {t('settings.appLanguage')}
                  </Text>
                </View>

                <View style={styles.languageList}>
                  <LanguageOption
                    language="en"
                    title="English"
                    subtitle={t('settings.english')}
                    selected={currentLanguage === 'en'}
                    disabled={savingLanguage}
                    onPress={() => changeLanguage('en')}
                  />

                  <LanguageOption
                    language="ru"
                    title="Русский"
                    subtitle={t('settings.russian')}
                    selected={currentLanguage === 'ru'}
                    disabled={savingLanguage}
                    onPress={() => changeLanguage('ru')}
                  />
                </View>

                {savingLanguage ? (
                  <ActivityIndicator
                    color={C.blue}
                    style={styles.saveIndicator}
                  />
                ) : (
                  <Text style={styles.settingsHint}>
                    {t('settings.savedAutomatically')}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.modalDescription}>
                {t('more.helpDescription')}
              </Text>
            )}

            <Pressable
              style={[
                styles.modalButton,
                savingLanguage && { opacity: 0.6 },
              ]}
              onPress={closePanel}
              disabled={savingLanguage}
            >
              <Text style={styles.modalButtonText}>
                {t('common.done')}
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
    backgroundColor: C.sky,
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
    color: C.navy,
    marginBottom: 17,
    marginLeft: 2,
  },
  menuCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 19,
    overflow: 'hidden',
  },
  menuItem: {
    minHeight: 58,
    paddingLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuPressed: {
    backgroundColor: '#EFF7FD',
  },
  iconBox: {
    width: 39,
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    minHeight: 58,
    paddingRight: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: C.navy,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(9,39,71,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: C.white,
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
    color: C.navy,
    textAlign: 'center',
  },
  modalDescription: {
    marginTop: 11,
    fontSize: 14,
    lineHeight: 21,
    color: C.muted,
    textAlign: 'center',
  },
  settingsContent: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: C.muted,
  },
  languageList: {
    width: '100%',
    gap: 10,
  },
  languageOption: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.divider,
    backgroundColor: C.white,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageSelected: {
    borderColor: C.blue,
    backgroundColor: '#F0F8FF',
  },
  flagBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#F3F7FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  flag: {
    fontSize: 25,
  },
  languageText: {
    flex: 1,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.navy,
  },
  languageSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: C.muted,
  },
  radio: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#B8CAD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: C.blue,
    backgroundColor: C.blue,
  },
  settingsHint: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: C.muted,
  },
  saveIndicator: {
    marginTop: 16,
  },
  modalButton: {
    width: '100%',
    height: 49,
    borderRadius: 15,
    backgroundColor: C.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 23,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: C.navy,
  },
});
