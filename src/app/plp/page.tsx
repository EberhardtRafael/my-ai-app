import { getServerSession } from 'next-auth';
import { PLP_PAGINATION_LIMIT } from '@/utils/constans';
import { fetchProducts } from '@/utils/fetchProducts';
import { authOptions } from '../api/auth/[...nextauth]/route';
import ProductList from './productList';
import PageHeader from '@/components/ui/PageHeader';

export type FilterParams = { [key: string]: string | undefined };

type ProductPageProps = {
  searchParams?: FilterParams;
};

export default async function ProductPage({ searchParams }: ProductPageProps) {
  const plpTitleText = 'Products';
  // Await searchParams if it's a Promise (Next.js 14+)
  const params =
    searchParams && typeof searchParams.then === 'function'
      ? await searchParams
      : searchParams || {};
  const searchTerm = typeof params.search === 'string' ? params.search : '';
  const category = typeof params.category === 'string' ? params.category : null;
  const color = typeof params.color === 'string' ? params.color : null;
  const data = await fetchProducts(searchTerm, category, color, 0, PLP_PAGINATION_LIMIT, true);
  const products = data?.data?.products || [];

  // Get user session and favorites
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  let favoriteProductIds: number[] = [];
  if (userId) {
    try {
      const query = `{ favorites(userId: ${userId}, activeOnly: true) { productId } }`;
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        cache: 'no-store',
      });
      const result = await response.json();
      favoriteProductIds = (result?.data?.favorites || []).map((fav: any) => fav.productId);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <PageHeader title={plpTitleText} />
      <ProductList
        initialProducts={products}
        initialFilters={params as FilterParams}
        userId={userId}
        favoriteProductIds={favoriteProductIds}
      />
    </main>
  );
}
