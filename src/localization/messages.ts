import en from '../../resources/en.json';

export const DEFAULT_LOCALE = 'en' as const;

export const SUPPORTED_LOCALES = [DEFAULT_LOCALE] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const messages = {
  en,
} as const;
