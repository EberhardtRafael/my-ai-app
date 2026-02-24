'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ProductGrid from '@/components/ProductGrid';
import Button from '@/components/ui/Button';
import { useFavorites } from '@/contexts/FavoritesContext';
import { PLP_PAGINATION_LIMIT } from '@/utils/constans';
import { fetchProducts, type Product } from '@/utils/fetchProducts';
import type { FilterParams } from './page';

type ProductListProps = {
  initialProducts: Product[];
  initialFilters?: FilterParams;
  userId?: string;
  favoriteProductIds?: number[];
};

export default function ProductList({
  initialProducts,
  initialFilters,
  userId,
  favoriteProductIds = [],
}: ProductListProps) {
  const noProductsText = 'No products found.';

  const router = useRouter();
  const searchParams = useSearchParams();
  const { favoritesCount } = useFavorites();

  const [category, setCategory] = useState<string | null>(initialFilters?.category || null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [currentFavoriteIds, setCurrentFavoriteIds] = useState<number[]>(favoriteProductIds);

  const offsetRef = useRef(initialProducts.length);
  const sentinelRef = useRef<HTMLDivElement>(null);

  //Where do I take the info about all possible categories, sizes and colors in real life?
  const categories: (string | null)[] = [
    null,
    'Clothing',
    'Footwear',
    'Accessories',
    'Tools',
    'Equipment',
  ];

  async function fetchCurrentFavorites(): Promise<void> {
    if (!userId) return;

    try {
      const query = `{ favorites(userId: ${userId}, activeOnly: true) { productId } }`;
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const result = await response.json();
      const favoriteIds = (result?.data?.favorites || []).map((fav: any) => fav.productId);
      setCurrentFavoriteIds(favoriteIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  }

  async function filterProducts(
    search: string | undefined = initialFilters?.search,
    selectedCategory: string | null
  ): Promise<void> {
    try {
      const data = await fetchProducts(search, selectedCategory, null);
      const fetchedProducts = data?.data?.products || [];
      offsetRef.current = fetchedProducts.length;
      setProducts(fetchedProducts);
      await fetchCurrentFavorites();
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
  }

  const loadMore = async () => {
    const data = await fetchProducts(
      initialFilters?.search,
      category,
      null,
      offsetRef.current,
      PLP_PAGINATION_LIMIT
    );
    const fetchedProducts = data?.data?.products || [];
    offsetRef.current += fetchedProducts.length;
    setProducts((prev) => [...prev, ...fetchedProducts]);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (products.length && entry.isIntersecting) {
        loadMore();
      }
    });
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => observer.disconnect();
  }, [products, loadMore]);

  const handleUrlOnFiltering = (category: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    router.push(`/plp?${params.toString()}`);
  };

  useEffect(() => {
    const search = searchParams.get('search') || '';
    // Only fetch if search changed (not category)
    if (category === (initialFilters?.category || null)) {
      filterProducts(search, category);
    }
  }, [searchParams]);

  useEffect(() => {
    const search = searchParams.get('search') || '';
    // Skip if no category change on initial mount
    if (category !== (initialFilters?.category || null)) {
      if (!search && !category) {
        offsetRef.current = initialProducts.length;
        setProducts(initialProducts);
      } else {
        filterProducts(search, category);
      }
      handleUrlOnFiltering(category);
    }
  }, [category]);

  // Refetch favorites when favorites count changes (from context)
  useEffect(() => {
    if (userId) {
      fetchCurrentFavorites();
    }
  }, [favoritesCount, userId]);

  return (
    <>
      <div className="flex flex-col sm:flex-row mb-6 divide-x divide-gray-200">
        {categories.map((cat, index) => (
          <Button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`
              ${
                category === cat
                  ? 'font-semibold bg-gray-300 text-black hover:bg-gray-300 hover:text-black'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-200 hover:text-gray-900 hover:font-medium'
              }
              ${index !== 0 && index !== categories.length - 1 && 'sm:rounded-none'}
              ${index === 0 && 'sm:rounded-r-none'}
              ${index === categories.length - 1 && 'sm:rounded-l-none'}
            `}
          >
            {cat || 'All'}
          </Button>
        ))}
      </div>
      <ProductGrid
        products={products}
        emptyMessage={noProductsText}
        userId={userId}
        favoriteProductIds={currentFavoriteIds}
      />
      <div ref={sentinelRef}></div>
    </>
  );
}
