import { getServerSession } from 'next-auth';
import ProductGrid from '@/components/ProductGrid';
import InfoMessage from '@/components/ui/InfoMessage';
import PageHeader from '@/components/ui/PageHeader';
import { getTranslator } from '@/localization';
import { DEFAULT_LOCALE } from '@/localization/messages';
import { fetchFavorites } from '@/utils/fetchFavorites';
import { authOptions } from '../api/auth/[...nextauth]/route';

export default async function FavoritesPage() {
  const t = getTranslator(DEFAULT_LOCALE);
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <PageHeader title={t('favoritesPage.title')} />
        <InfoMessage
          message={t('favoritesPage.signInPrompt')}
          linkText={t('favoritesPage.signInLink')}
          linkHref="/auth/signin"
        />
      </main>
    );
  }

  // Fetch user's favorites
  const userId = parseInt(session.user.id || '0', 10);
  const data = await fetchFavorites(userId, true);
  const favorites = data?.data?.favorites || [];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <PageHeader title={t('favoritesPage.title')} />
      <ProductGrid
        products={favorites.map((fav) => fav.product)}
        emptyMessage={t('favoritesPage.emptyMessage')}
      />
    </main>
  );
}
