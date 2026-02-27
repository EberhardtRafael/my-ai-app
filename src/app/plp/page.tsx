import { getServerSession } from 'next-auth';
import Breadcrumb from '@/components/ui/Breadcrumb';
import PageHeader from '@/components/ui/PageHeader';
import { PLP_PAGINATION_LIMIT } from '@/utils/constans';
import { fetchProducts } from '@/utils/fetchProducts';
import { authOptions } from '../api/auth/[...nextauth]/route';
import ProductList from './productList';

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
  const assistantSession =
    typeof params.assistantSession === 'string' ? params.assistantSession : undefined;
  const assistantRecommendedIdsRaw =
    typeof params.assistantRecs === 'string' ? params.assistantRecs : '';
  const assistantRecommendedIds = assistantRecommendedIdsRaw
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isFinite(id));
  const data = await fetchProducts(searchTerm, category, color, 0, PLP_PAGINATION_LIMIT, true);
  const products = data?.data?.products || [];

  // Get user session and favorites
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const favoriteProductIds = userId
    ? await (async () => {
        try {
          const query = `{ favorites(userId: ${userId}, activeOnly: true) { productId } }`;
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
            cache: 'no-store',
          });
          const result = await response.json();
          return (result?.data?.favorites || []).map((fav: any) => fav.productId);
        } catch (error) {
          console.error('Error fetching favorites:', error);
          return [];
        }
      })()
    : [];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <Breadcrumb className="mb-3" items={[{ label: 'Home', href: '/' }, { label: 'Products' }]} />
      <PageHeader title={plpTitleText} />
      <ProductList
        initialProducts={products}
        initialFilters={params as FilterParams}
        userId={userId}
        favoriteProductIds={favoriteProductIds}
        assistantSession={assistantSession}
        assistantRecommendedIds={assistantRecommendedIds}
      />
    </main>
  );
}
