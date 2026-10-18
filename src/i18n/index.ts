
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import ru from './locales/ru';

export type AppLanguage = 'en' | 'ru';

const LANGUAGE_STORAGE_KEY = '@lovablecar/language';

export const DEFAULT_LANGUAGE: AppLanguage = 'en';

export const SUPPORTED_LANGUAGES: AppLanguage[] = [
  'en',
  'ru',
];

export function isAppLanguage(
  value: unknown,
): value is AppLanguage {
  return value === 'en' || value === 'ru';
}

void i18n.use(initReactI18next).init({
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,

  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },

  interpolation: {
    escapeValue: false,
  },

  react: {
    useSuspense: false,
  },

  returnNull: false,
});

let languageRestored = false;
let restorationPromise: Promise<void> | null = null;

export async function restoreLanguage(): Promise<void> {
  if (languageRestored) return;

  if (restorationPromise) {
    return restorationPromise;
  }

  restorationPromise = (async () => {
    try {
      const saved = await AsyncStorage.getItem(
        LANGUAGE_STORAGE_KEY,
      );

      if (isAppLanguage(saved)) {
        await i18n.changeLanguage(saved);
      }
    } catch (error) {
      console.warn(
        '[i18n] Failed to restore language:',
        error,
      );
    } finally {
      languageRestored = true;
    }
  })();

  return restorationPromise;
}

export async function setAppLanguage(
  language: AppLanguage,
): Promise<void> {
  await restoreLanguage();

  const previousLanguage = i18n.language;

  await i18n.changeLanguage(language);

  try {
    await AsyncStorage.setItem(
      LANGUAGE_STORAGE_KEY,
      language,
    );
  } catch (error) {
    await i18n.changeLanguage(previousLanguage);
    throw error;
  }
}

export function getAppLanguage(): AppLanguage {
  return isAppLanguage(i18n.language)
    ? i18n.language
    : DEFAULT_LANGUAGE;
}

export default i18n;
