'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import TrendingProducts from '@/components/TrendingProducts';
import Carousel from '@/components/ui/Carousel';
import InfoMessage from '@/components/ui/InfoMessage';
import ProductCardCompact from '@/components/ui/ProductCardCompact';
import SectionHeader from '@/components/ui/SectionHeader';
import { useLocalization } from '@/contexts/LocalizationContext';
import { useProfile } from '@/contexts/ProfileContext';
import type { RecommendedProduct } from '@/utils/fetchRecommendations';
import { fetchRecommendations } from '@/utils/fetchRecommendations';

export default function Home() {
  const { t } = useLocalization();
  const { data: session } = useSession();
  const { displayName } = useProfile();
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const sessionUserId = session?.user?.id;

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);

        if (sessionUserId) {
          const products = await fetchRecommendations(Number(sessionUserId), 12);
          setRecommendations(products);
        } else {
          const products = await fetchRecommendations(1, 12);
          setRecommendations(products);
        }
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [sessionUserId]);

  // Business logic: Compute title and subtitle based on session
  const title = displayName
    ? t('homePage.titlePersonalized', { name: displayName })
    : t('homePage.title');
  const subtitle = session?.user?.id
    ? t('homePage.subtitlePersonalized')
    : t('homePage.subtitleTrending');

  const loadingSkeletons = Array.from({ length: 8 }, (_, i) => `loading-skeleton-${i}`);

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
              {loadingSkeletons.map((key) => (
                <div key={key} className="bg-white rounded-lg shadow-sm h-96 animate-pulse">
                  <div className="h-64 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
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
                message={t('homePage.noRecommendations')}
                variant="muted"
                className="mb-2"
              />
              <InfoMessage
                message={t('homePage.browseToLearn')}
                linkText={t('homePage.catalogLink')}
                linkHref="/plp"
                variant="muted"
              />
            </div>
          )}

          <div className="mt-8 text-center">
            <InfoMessage
              message={t('homePage.browseMore')}
              linkText={t('homePage.catalogLink')}
              linkHref="/plp"
              className="text-sm"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
