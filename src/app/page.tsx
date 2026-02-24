'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import TrendingProducts from '@/components/TrendingProducts';
import Carousel from '@/components/ui/Carousel';
import InfoMessage from '@/components/ui/InfoMessage';
import ProductCardCompact from '@/components/ui/ProductCardCompact';
import SectionHeader from '@/components/ui/SectionHeader';
import type { RecommendedProduct } from '@/utils/fetchRecommendations';
import { fetchRecommendations } from '@/utils/fetchRecommendations';

export default function Home() {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (session?.user?.id) {
        setLoading(true);
        const products = await fetchRecommendations(Number(session.user.id), 12);
        setRecommendations(products);
        setLoading(false);
      } else {
        // For logged-out users, still fetch trending products (user_id=1 as guest)
        setLoading(true);
        const products = await fetchRecommendations(1, 12);
        setRecommendations(products);
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [session]);

  // Business logic: Compute title and subtitle based on session
  const title = session?.user?.name ? `For You, ${session.user.name}` : 'For You';
  const subtitle = session?.user?.id
    ? 'Personalized recommendations based on your preferences'
    : 'Trending products you might love';

  return (
    <main className="min-h-screen flex flex-col p-6 bg-gray-50">
      <section className="max-w-7xl mx-auto w-full mt-20">
        {/* Trending Products Section */}
        <TrendingProducts userId={session?.user?.id} hours={48} limit={10} />

        {/* Personalized Recommendations Section */}
        <div className="mt-12">
          <SectionHeader title={title} subtitle={subtitle} />

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }, (_, i) => `loading-skeleton-${Date.now()}-${i}`).map(
                (key) => (
                  <div key={key} className="bg-white rounded-lg shadow-sm h-96 animate-pulse">
                    <div className="h-64 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : recommendations.length > 0 ? (
            <Carousel itemsPerView={6} gap={16} className="py-4">
              {recommendations.map((product) => (
                <ProductCardCompact
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  category={product.category}
                  price={product.price}
                  userId={session?.user?.id}
                  color={product.variants[0]?.color}
                />
              ))}
            </Carousel>
          ) : (
            <div className="text-center py-12">
              <InfoMessage
                message="No recommendations available at the moment."
                variant="muted"
                className="mb-2"
              />
              <InfoMessage
                message="Browse our products to help us learn your preferences!"
                linkText="catalog"
                linkHref="/plp"
                variant="muted"
              />
            </div>
          )}

          <div className="mt-8 text-center">
            <InfoMessage
              message="Browse more products in our"
              linkText="catalog"
              linkHref="/plp"
              className="text-sm"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
