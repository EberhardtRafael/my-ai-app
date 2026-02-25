'use client';

import { NextIntlClientProvider, useLocale, useTranslations } from 'next-intl';
import { DEFAULT_LOCALE, type Locale } from '@/localization/messages';

type LocalizationProviderProps = {
  children: React.ReactNode;
  locale?: Locale;
  messages: Record<string, unknown>;
};

export const LocalizationProvider = ({
  children,
  locale = DEFAULT_LOCALE,
  messages,
}: LocalizationProviderProps) => {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
};

export const useLocalization = () => {
  const locale = useLocale() as Locale;
  const translations = useTranslations();

  return {
    locale,
    setLocale: () => {},
    t: (key: string, values?: Record<string, string | number>) =>
      translations(key, values as Record<string, string | number | Date> | undefined),
  };
};
