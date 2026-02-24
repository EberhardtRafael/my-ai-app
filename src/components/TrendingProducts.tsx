'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/utils/fetchProducts';
import { fetchTrending } from '@/utils/fetchTrending';
import Carousel from './ui/Carousel';
import ProductCardCompact from './ui/ProductCardCompact';
import SectionHeader from './ui/SectionHeader';

type TrendingProductsProps = {
  userId?: string;
  favoriteProductIds?: number[];
  hours?: number;
  limit?: number;
};

export default function TrendingProducts({
  userId,
  favoriteProductIds = [],
  hours = 48,
  limit = 10,
}: TrendingProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrending() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchTrending(hours, limit);
        setProducts(data);
      } catch (err) {
        console.error('Error fetching trending products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trending products');
      } finally {
        setLoading(false);
      }
    }

    loadTrending();
  }, [hours, limit]);

  if (loading) {
    return (
      <section className="py-8">
        <SectionHeader
          title="Trending Now"
          subtitle={`Popular items in the last ${hours} hours`}
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <SectionHeader
          title="Trending Now"
          subtitle={`Popular items in the last ${hours} hours`}
        />
        <div className="text-center py-8 text-red-600">{error}</div>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Don't show section if no trending products
  }

  return (
    <section className="py-8">
      <SectionHeader
        title="Trending Now"
        subtitle={`Popular items in the last ${hours} hours`}
      />
      <Carousel itemsPerView={5} gap={12}>
        {products.map((product) => {
          const firstColor = product.variants?.[0]?.color;
          return (
            <ProductCardCompact
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              userId={userId}
              initialIsFavorite={favoriteProductIds.includes(product.id as number)}
              color={firstColor}
            />
          );
        })}
      </Carousel>
    </section>
  );
}
