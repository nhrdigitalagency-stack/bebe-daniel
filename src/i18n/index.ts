import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import en from './en.json';
import { eventConfig } from '../config/eventConfig';

const STORAGE_KEY = 'daniel_event_locale';

function getInitialLocale(): 'fr' | 'en' {
  if (typeof window === 'undefined') {
    return eventConfig.defaultLocale;
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') {
      return saved;
    }
  } catch {
    // Ignore localStorage security errors in restricted contexts
  }
  return eventConfig.defaultLocale;
}

const initialLocale = getInitialLocale();

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: initialLocale,
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

function syncDocumentMetadata(lng: string) {
  if (typeof document === 'undefined') return;
  const normalized = lng === 'en' ? 'en' : 'fr';
  document.documentElement.lang = normalized;

  const title = i18n.t('meta.title', { lng: normalized });
  const description = i18n.t('meta.description', { lng: normalized });

  if (title) {
    document.title = title;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', title);
  }

  if (description) {
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', description);
  }
}

syncDocumentMetadata(initialLocale);

i18n.on('languageChanged', (lng) => {
  const normalized = lng === 'en' ? 'en' : 'fr';
  try {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // Ignore storage quota errors
  }
  syncDocumentMetadata(normalized);
});

export function setAppLanguage(lng: 'fr' | 'en') {
  i18n.changeLanguage(lng);
}

export default i18n;
