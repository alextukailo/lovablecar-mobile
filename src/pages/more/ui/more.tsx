import { C, styles } from '@/pages/more/ui/more.styles';

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
    Text,
    View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfileMenu } from '@/shared/ui/ProfileMenuContext';

import {
    getAppLanguage,
    setAppLanguage,
    type AppLanguage,
} from '@/i18n';



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
          '../../../../assets/images/lovablecar-main-background.png'
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
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
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
