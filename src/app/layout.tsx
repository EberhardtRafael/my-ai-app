import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Auth from '@/components/Auth';
import SessionWrapper from '@/components/SessionWrapper';
import { CartProvider } from '@/contexts/CartContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { PlpSearchStateProvider } from '@/contexts/PlpSearchStateContext';
import { getTranslator } from '@/localization';
import { DEFAULT_LOCALE, messages } from '@/localization/messages';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const t = getTranslator();

export const metadata: Metadata = {
  title: t('layout.title'),
  description: t('layout.description'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <LocalizationProvider locale={DEFAULT_LOCALE} messages={messages[DEFAULT_LOCALE]}>
          <SessionWrapper>
            <FavoritesProvider>
              <CartProvider>
                <PlpSearchStateProvider>
                  <Auth>{children}</Auth>
                </PlpSearchStateProvider>
              </CartProvider>
            </FavoritesProvider>
          </SessionWrapper>
        </LocalizationProvider>
      </body>
    </html>
  );
}
