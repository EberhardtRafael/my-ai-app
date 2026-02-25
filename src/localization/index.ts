import { DEFAULT_LOCALE, type Locale, messages } from './messages';

type TranslationValues = Record<string, string | number>;

const resolveMessage = (obj: unknown, path: string): string | undefined => {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }

  const result = path.split('.').reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== 'object') {
      return undefined;
    }

    return (acc as Record<string, unknown>)[key];
  }, obj);

  return typeof result === 'string' ? result : undefined;
};

const interpolate = (template: string, values?: TranslationValues): string => {
  if (!values) return template;

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = values[key];
    return value === undefined ? `{${key}}` : String(value);
  });
};

export const translate = (
  locale: Locale,
  key: string,
  values?: TranslationValues
): string => {
  const localeMessages = messages[locale] || messages[DEFAULT_LOCALE];
  const fallbackMessages = messages[DEFAULT_LOCALE];

  const message = resolveMessage(localeMessages, key) || resolveMessage(fallbackMessages, key) || key;

  return interpolate(message, values);
};

export const getTranslator = (locale: Locale = DEFAULT_LOCALE) => {
  return (key: string, values?: TranslationValues) => translate(locale, key, values);
};

export type Translator = ReturnType<typeof getTranslator>;
