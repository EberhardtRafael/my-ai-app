import { getServerSession } from 'next-auth';
import ProductGrid from '@/components/ProductGrid';
import InfoMessage from '@/components/ui/InfoMessage';
import { fetchFavorites } from '@/utils/fetchFavorites';
import { authOptions } from '../api/auth/[...nextauth]/route';
import PageHeader from '@/components/ui/PageHeader';

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <PageHeader title="My Favorites" />
        <InfoMessage
          message="Please sign in to view your favorites."
          linkText="Sign in here"
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
      <PageHeader title="My Favorites" />

      <ProductGrid
        products={favorites.map((fav) => fav.product)}
        emptyMessage="You haven't added any favorites yet."
      />
    </main>
  );
}
