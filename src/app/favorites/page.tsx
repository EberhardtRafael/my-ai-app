import { getServerSession } from 'next-auth';
import ProductGrid from '@/components/ProductGrid';
import InfoMessage from '@/components/ui/InfoMessage';
import { fetchFavorites } from '@/utils/fetchFavorites';
import { authOptions } from '../api/auth/[...nextauth]/route';

export default async function FavoritesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-3xl font-bold mb-6">My Favorites</h1>
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
      <h1 className="text-3xl font-bold mb-6">My Favorites</h1>

      <ProductGrid
        products={favorites.map((fav) => fav.product)}
        emptyMessage="You haven't added any favorites yet."
      />
    </main>
  );
}
