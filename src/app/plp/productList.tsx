'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProductGrid from '@/components/ProductGrid';
import ClearFiltersButton from '@/components/ui/ClearFiltersButton';
import { useFavorites } from '@/contexts/FavoritesContext';
import { usePlpSearchState } from '@/contexts/PlpSearchStateContext';
import { PLP_PAGINATION_LIMIT } from '@/utils/constans';
import { fetchProducts, type Product } from '@/utils/fetchProducts';
import type { FilterSidebarSection } from './FilterSidebar';
import FilterSidebar from './FilterSidebar';
import type { FilterParams } from './page';

type ProductListProps = {
  initialProducts: Product[];
  initialFilters?: FilterParams;
  userId?: string;
  favoriteProductIds?: number[];
  assistantSession?: string;
  assistantRecommendedIds?: number[];
};

export default function ProductList({
  initialProducts,
  initialFilters,
  userId,
  favoriteProductIds = [],
  assistantSession,
  assistantRecommendedIds = [],
}: ProductListProps) {
  const noProductsText = 'No products found.';

  const searchParams = useSearchParams();
  const { favoritesCount } = useFavorites();
  const { hasPendingSearch, setHasPendingSearch } = usePlpSearchState();
  const currentSearch = searchParams.get('search') || '';

  const initialCategory = initialFilters?.category || null;
  const initialColor = initialFilters?.color || '';
  const initialBrand = initialFilters?.brand || '';
  const initialMaterial = initialFilters?.material || '';
  const initialSize = initialFilters?.size || '';
  const initialCharacteristics =
    (initialFilters?.characteristics || '').split(',')[0]?.trim() || '';

  const [category, setCategory] = useState<string | null>(initialCategory);
  const [color, setColor] = useState<string>(initialColor);
  const [brand, setBrand] = useState<string>(initialBrand);
  const [material, setMaterial] = useState<string>(initialMaterial);
  const [size, setSize] = useState<string>(initialSize);
  const [characteristics, setCharacteristics] = useState<string>(initialCharacteristics);
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [currentFavoriteIds, setCurrentFavoriteIds] = useState<number[]>(favoriteProductIds);

  const offsetRef = useRef(initialProducts.length);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);

  const categories: (string | null)[] = [
    null,
    'Clothing',
    'Footwear',
    'Accessories',
    'Tools',
    'Equipment',
  ];

  const toSortedOptions = (values: Iterable<string>, allLabel: string) => {
    const uniqueValues = [...new Set(values)].filter(Boolean);

    return [
      { value: '', label: allLabel },
      ...uniqueValues
        .sort((left, right) => left.localeCompare(right))
        .map((value) => ({ value, label: value })),
    ];
  };

  const buildOptionsFromProducts = (
    allLabel: string,
    collectValues: (product: Product) => string[]
  ) => {
    const collectedValues = allProducts.flatMap(collectValues);
    return toSortedOptions(collectedValues, allLabel);
  };

  const matchesContainsFilter = (selectedFilter: string, targetValue: string) =>
    !selectedFilter || targetValue.includes(selectedFilter.toLowerCase());

  const matchesAnyExactFilter = (selectedFilter: string, values: string[]) =>
    !selectedFilter || values.includes(selectedFilter.toLowerCase());

  const matchesLocalFilters = (product: Product): boolean => {
    const productBrand = (product.brand || '').toLowerCase();
    const productMaterial = (product.material || '').toLowerCase();
    const variants = Array.isArray(product.variants) ? product.variants : [];

    const variantColors = variants
      .map((variant: any) => (variant?.color || '').toLowerCase())
      .filter(Boolean);
    const variantSizes = variants
      .map((variant: any) => (variant?.size || '').toLowerCase())
      .filter(Boolean);

    if (!matchesContainsFilter(brand, productBrand)) return false;
    if (!matchesContainsFilter(material, productMaterial)) return false;
    if (!matchesAnyExactFilter(color, variantColors)) return false;
    if (!matchesAnyExactFilter(size, variantSizes)) return false;

    const searchableText = [
      product.name,
      product.category,
      product.description,
      product.brand,
      product.material,
      product.tags,
      ...variants.map(
        (variant: any) => `${variant?.sku || ''} ${variant?.color || ''} ${variant?.size || ''}`
      ),
    ]
      .join(' ')
      .toLowerCase();

    return matchesContainsFilter(characteristics, searchableText);
  };

  const applyLocalFilters = (sourceProducts: Product[]): Product[] =>
    sourceProducts.filter((product) => matchesLocalFilters(product));

  const dedupeProducts = (sourceProducts: Product[]): Product[] => {
    const productsByKey = new Map<string, Product>();

    for (const product of sourceProducts) {
      const key =
        product.id !== undefined && product.id !== null
          ? `id-${product.id}`
          : `fallback-${product.name || 'product'}-${product.category || 'category'}-${
              product.price || 'price'
            }`;

      if (!productsByKey.has(key)) {
        productsByKey.set(key, product);
      }
    }

    return [...productsByKey.values()];
  };

  const colorOptions = useMemo(
    () =>
      buildOptionsFromProducts('All colors', (product) => {
        if (!Array.isArray(product.variants)) return [];
        return product.variants.map((variant) => (variant?.color || '').trim()).filter(Boolean);
      }),
    [allProducts]
  );

  const sizeOptions = useMemo(
    () =>
      buildOptionsFromProducts('All sizes', (product) => {
        if (!Array.isArray(product.variants)) return [];
        return product.variants.map((variant) => (variant?.size || '').trim()).filter(Boolean);
      }),
    [allProducts]
  );

  const brandOptions = useMemo(
    () =>
      buildOptionsFromProducts('All brands', (product) => {
        const productBrand = (product.brand || '').trim();
        return productBrand ? [productBrand] : [];
      }),
    [allProducts]
  );

  const materialOptions = useMemo(
    () =>
      buildOptionsFromProducts('All materials', (product) => {
        const productMaterial = (product.material || '').trim();
        return productMaterial ? [productMaterial] : [];
      }),
    [allProducts]
  );

  const characteristicOptions = useMemo(
    () =>
      buildOptionsFromProducts('All characteristics', (product) => {
        const tagsValue = (product.tags || '').trim();
        if (!tagsValue) return [];

        return tagsValue
          .split(/[;,|]/)
          .map((tag) => tag.trim())
          .filter(Boolean);
      }),
    [allProducts]
  );

  const categoryOptions = categories.map((cat) => ({
    value: cat || '',
    label: cat || 'All categories',
  }));

  const filterSections = useMemo<FilterSidebarSection[]>(
    () => [
      {
        key: 'category',
        title: 'Category',
        selectedValue: category || '',
        options: categoryOptions,
        onSelect: (value) => setCategory(value || null),
      },
      {
        key: 'color',
        title: 'Color',
        selectedValue: color,
        options: colorOptions,
        onSelect: setColor,
      },
      {
        key: 'size',
        title: 'Size',
        selectedValue: size,
        options: sizeOptions,
        onSelect: setSize,
      },
      {
        key: 'brand',
        title: 'Brand',
        selectedValue: brand,
        options: brandOptions,
        onSelect: setBrand,
      },
      {
        key: 'material',
        title: 'Material',
        selectedValue: material,
        options: materialOptions,
        onSelect: setMaterial,
      },
      {
        key: 'characteristics',
        title: 'Characteristics',
        selectedValue: characteristics,
        options: characteristicOptions,
        onSelect: setCharacteristics,
      },
    ],
    [
      brand,
      brandOptions,
      category,
      categoryOptions,
      characteristicOptions,
      characteristics,
      color,
      colorOptions,
      material,
      materialOptions,
      size,
      sizeOptions,
    ]
  );

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
    selectedCategory: string | null,
    _selectedColor: string
  ): Promise<void> {
    try {
      const data = await fetchProducts(search, selectedCategory, null);
      const fetchedProducts = dedupeProducts(data?.data?.products || []);
      offsetRef.current = fetchedProducts.length;
      hasMoreRef.current = fetchedProducts.length > 0;
      setAllProducts(fetchedProducts);
      setProducts(applyLocalFilters(fetchedProducts));
      await fetchCurrentFavorites();
    } catch (err) {
      console.error(err);
      setAllProducts([]);
      setProducts([]);
    }
  }

  const loadMore = async () => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;

    isLoadingMoreRef.current = true;
    try {
      const data = await fetchProducts(
        currentSearch,
        category,
        null,
        offsetRef.current,
        PLP_PAGINATION_LIMIT
      );
      const fetchedProducts = dedupeProducts(data?.data?.products || []);

      if (fetchedProducts.length === 0) {
        hasMoreRef.current = false;
        return;
      }

      setAllProducts((prev) => {
        const mergedProducts = dedupeProducts([...prev, ...fetchedProducts]);
        offsetRef.current = mergedProducts.length;
        setProducts(applyLocalFilters(mergedProducts));
        return mergedProducts;
      });
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      isLoadingMoreRef.current = false;
    }
  };

  const clearAllFilters = async () => {
    setHasPendingSearch(false);
    setCategory(null);
    setColor('');
    setBrand('');
    setMaterial('');
    setSize('');
    setCharacteristics('');

    try {
      const data = await fetchProducts('', null, null);
      const fetchedProducts = dedupeProducts(data?.data?.products || []);
      offsetRef.current = fetchedProducts.length;
      hasMoreRef.current = fetchedProducts.length > 0;
      setAllProducts(fetchedProducts);
      setProducts(applyLocalFilters(fetchedProducts));
    } catch (error) {
      console.error('Error clearing all filters:', error);
    }

    window.history.replaceState({}, '', '/plp');
  };

  useEffect(() => {
    setHasPendingSearch(false);
  }, [currentSearch]);

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

  const handleUrlOnFiltering = () => {
    const params = new URLSearchParams(window.location.search);
    const filterValues: Record<string, string | null> = {
      category,
      color,
      brand,
      material,
      size,
      characteristics,
    };

    for (const [key, value] of Object.entries(filterValues)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      const nextUrl = nextQuery ? `/plp?${nextQuery}` : '/plp';
      window.history.replaceState({}, '', nextUrl);
    }
  };

  useEffect(() => {
    const search = searchParams.get('search') || '';
    if (category === initialCategory && color === initialColor) {
      if (!search && !category && !color) {
        const dedupedInitialProducts = dedupeProducts(initialProducts);
        setAllProducts(dedupedInitialProducts);
        setProducts(applyLocalFilters(dedupedInitialProducts));
      } else {
        filterProducts(search, category, color);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const search = searchParams.get('search') || '';
    const categoryChanged = category !== initialCategory;
    const colorChanged = color !== initialColor;

    if (categoryChanged) {
      if (!search && !category) {
        const dedupedInitialProducts = dedupeProducts(initialProducts);
        offsetRef.current = dedupedInitialProducts.length;
        hasMoreRef.current = true;
        setAllProducts(dedupedInitialProducts);
        setProducts(applyLocalFilters(dedupedInitialProducts));
      } else {
        filterProducts(search, category, color);
      }
    } else if (colorChanged) {
      setProducts(applyLocalFilters(allProducts));
    }

    if (categoryChanged || colorChanged) {
      handleUrlOnFiltering();
    }
  }, [category, color]);

  useEffect(() => {
    setProducts(applyLocalFilters(allProducts));
    handleUrlOnFiltering();
  }, [brand, material, size, characteristics]);

  // Refetch favorites when favorites count changes (from context)
  useEffect(() => {
    if (userId) {
      fetchCurrentFavorites();
    }
  }, [favoritesCount, userId]);

  const hasActiveFilters = Boolean(
    hasPendingSearch ||
      currentSearch ||
      category ||
      color ||
      brand ||
      material ||
      size ||
      characteristics
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
      <FilterSidebar sections={filterSections} />

      <section>
        <div className="mb-3 flex min-h-8 justify-end">
          <ClearFiltersButton
            onClear={clearAllFilters}
            className={hasActiveFilters ? '' : 'invisible pointer-events-none'}
          />
        </div>
        <ProductGrid
          products={products}
          emptyMessage={noProductsText}
          userId={userId}
          favoriteProductIds={currentFavoriteIds}
          assistantSession={assistantSession}
          assistantRecommendedIds={assistantRecommendedIds}
          activeColorFilter={color}
        />
        <div ref={sentinelRef}></div>
      </section>
    </div>
  );
}
