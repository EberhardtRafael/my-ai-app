'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import type { FilterSidebarSection } from '@/app/plp/FilterSidebar';
import FilterSidebar from '@/app/plp/FilterSidebar';
import LoadingState from '@/components/LoadingState';
import ProductGrid from '@/components/ProductGrid';
import ReviewsSection from '@/components/ReviewsSection';
import SidePanel from '@/components/SidePanel';
import Button from '@/components/ui/Button';
import ClearFiltersButton from '@/components/ui/ClearFiltersButton';
import InfoMessage from '@/components/ui/InfoMessage';
import { useFavorites } from '@/contexts/FavoritesContext';
import { getProductImageUrl } from '@/utils/colorUtils';
import type { Product } from '@/utils/fetchProducts';
import { getEffectiveUserId } from '@/utils/guestSessionClient';
import { getSizeLabel } from '@/utils/productUtils';

type PDPPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default function PDPPage({ params }: PDPPageProps) {
  const [id, setId] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [cartUserId, setCartUserId] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [favoriteProductIds, setFavoriteProductIds] = useState<number[]>([]);
  const [relatedCategory, setRelatedCategory] = useState('');
  const [relatedColor, setRelatedColor] = useState('');
  const [relatedSize, setRelatedSize] = useState('');
  const [relatedBrand, setRelatedBrand] = useState('');
  const [relatedMaterial, setRelatedMaterial] = useState('');
  const [activeTab, setActiveTab] = useState<'reviews' | 'related'>('reviews');
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { favoritesCount } = useFavorites();

  const toUniqueSorted = (values: string[]) =>
    [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));

  const collectVariantValues = (sourceProduct: Product, field: 'color' | 'size') => {
    if (!Array.isArray(sourceProduct.variants)) return [];
    return sourceProduct.variants
      .map((variant: any) => String(variant?.[field] || '').trim())
      .filter(Boolean);
  };

  const normalize = (value: string | null | undefined) => (value || '').trim().toLowerCase();

  const relatedFilterSections = useMemo<FilterSidebarSection[]>(
    () => [
      {
        key: 'related-category',
        title: 'Category',
        selectedValue: relatedCategory,
        options: [
          { value: '', label: 'All categories' },
          ...toUniqueSorted(
            relatedProducts.map((sourceProduct) => String(sourceProduct.category || '').trim())
          ).map((value) => ({ value, label: value })),
        ],
        onSelect: setRelatedCategory,
        defaultOpen: false,
      },
      {
        key: 'related-color',
        title: 'Color',
        selectedValue: relatedColor,
        options: [
          { value: '', label: 'All colors' },
          ...toUniqueSorted(
            relatedProducts.flatMap((sourceProduct) => collectVariantValues(sourceProduct, 'color'))
          ).map((value) => ({ value, label: value })),
        ],
        onSelect: setRelatedColor,
        defaultOpen: false,
      },
      {
        key: 'related-size',
        title: 'Size',
        selectedValue: relatedSize,
        options: [
          { value: '', label: 'All sizes' },
          ...toUniqueSorted(
            relatedProducts.flatMap((sourceProduct) => collectVariantValues(sourceProduct, 'size'))
          ).map((value) => ({ value, label: value })),
        ],
        onSelect: setRelatedSize,
        defaultOpen: false,
      },
      {
        key: 'related-brand',
        title: 'Brand',
        selectedValue: relatedBrand,
        options: [
          { value: '', label: 'All brands' },
          ...toUniqueSorted(
            relatedProducts.map((sourceProduct) => String(sourceProduct.brand || '').trim())
          ).map((value) => ({ value, label: value })),
        ],
        onSelect: setRelatedBrand,
        defaultOpen: false,
      },
      {
        key: 'related-material',
        title: 'Material',
        selectedValue: relatedMaterial,
        options: [
          { value: '', label: 'All materials' },
          ...toUniqueSorted(
            relatedProducts.map((sourceProduct) => String(sourceProduct.material || '').trim())
          ).map((value) => ({ value, label: value })),
        ],
        onSelect: setRelatedMaterial,
        defaultOpen: false,
      },
    ],
    [relatedCategory, relatedColor, relatedSize, relatedBrand, relatedMaterial, relatedProducts]
  );

  const filteredRelatedProducts = useMemo(
    () =>
      relatedProducts.filter((sourceProduct) => {
        const variantColors = collectVariantValues(sourceProduct, 'color').map(normalize);
        const variantSizes = collectVariantValues(sourceProduct, 'size').map(normalize);

        if (
          relatedCategory &&
          normalize(String(sourceProduct.category || '')) !== normalize(relatedCategory)
        ) {
          return false;
        }
        if (
          relatedBrand &&
          normalize(String(sourceProduct.brand || '')) !== normalize(relatedBrand)
        ) {
          return false;
        }
        if (
          relatedMaterial &&
          normalize(String(sourceProduct.material || '')) !== normalize(relatedMaterial)
        ) {
          return false;
        }
        if (relatedColor && !variantColors.includes(normalize(relatedColor))) {
          return false;
        }
        if (relatedSize && !variantSizes.includes(normalize(relatedSize))) {
          return false;
        }

        return true;
      }),
    [relatedProducts, relatedCategory, relatedColor, relatedSize, relatedBrand, relatedMaterial]
  );

  const hasActiveRelatedFilters = Boolean(
    relatedCategory || relatedColor || relatedSize || relatedBrand || relatedMaterial
  );

  const clearRelatedFilters = () => {
    setRelatedCategory('');
    setRelatedColor('');
    setRelatedSize('');
    setRelatedBrand('');
    setRelatedMaterial('');
  };

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = 'then' in params ? await params : params;
      setId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // Fetch product data
  useEffect(() => {
    const resolveCartUserId = async () => {
      const resolvedUserId = await getEffectiveUserId(session?.user?.id ?? null);
      setCartUserId(resolvedUserId);
    };

    resolveCartUserId();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!id) return;
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const productQuery = `{ product(id: ${id}) { 
      id name price category 
      ratingAvg ratingCount 
      variants { id sku color size stock } 
    } }`;
    const productResponse = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: productQuery }),
    });
    const productResult = await productResponse.json();
    const fetchedProduct = productResult?.data?.product;

    // Fetch reviews separately
    const reviewsQuery = `{ reviews(productId: ${id}, limit: 20) { 
      id productId userId username rating title comment 
      verifiedPurchase helpfulCount createdAt updatedAt 
    } }`;
    const reviewsResponse = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: reviewsQuery }),
    });
    const reviewsResult = await reviewsResponse.json();
    const reviews = reviewsResult?.data?.reviews || [];

    const relatedProductsQuery = `{ relatedProducts(productId: ${id}, limit: 6) {
      id name category price description brand material tags ratingAvg ratingCount salesCount imageUrl createdAt
      variants { id sku color size stock }
    } }`;
    const relatedProductsResponse = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: relatedProductsQuery }),
    });
    const relatedProductsResult = await relatedProductsResponse.json();
    const fetchedRelatedProducts = relatedProductsResult?.data?.relatedProducts || [];

    setProduct({ ...fetchedProduct, reviews });
    setRelatedProducts(fetchedRelatedProducts);

    // Set initial color and size to first variant's values
    if (fetchedProduct?.variants?.[0]) {
      setSelectedColor(fetchedProduct.variants[0].color);
      setSelectedSize(fetchedProduct.variants[0].size);
    }
  };

  // Check if product is favorited
  useEffect(() => {
    if (!userId || !id) return;

    const checkFavorite = async () => {
      try {
        const query = `{ favorites(userId: ${userId}, activeOnly: true) { productId } }`;
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const result = await response.json();
        const favorites = result?.data?.favorites || [];
        const ids = favorites.map((fav: any) => fav.productId);
        setFavoriteProductIds(ids);
        setIsFavorite(favorites.some((fav: any) => fav.productId === parseInt(id, 10)));
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavorite();
  }, [userId, id, favoritesCount]);

  if (!id || !product) {
    return <LoadingState />;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Product Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Product Image */}
          <div className="md:col-span-2 h-96 rounded-lg overflow-hidden relative">
            <img
              src={getProductImageUrl(selectedColor || product.variants?.[0]?.color, 800, 600)}
              alt={product.name || 'Product'}
              className="w-full h-full object-cover"
            />
            {selectedSize && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded">
                <span className="text-lg font-semibold">Size: {getSizeLabel(selectedSize)}</span>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="md:col-span-1 h-96">
            <SidePanel
              productId={id}
              userId={userId}
              cartUserId={cartUserId || undefined}
              initialIsFavorite={isFavorite}
              product={product}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              onColorChange={setSelectedColor}
              onSizeChange={setSelectedSize}
              onFavoriteChange={setIsFavorite}
            />
          </div>
        </div>
      </div>

      {/* Related Products + Reviews Tabs */}
      <div className="mt-10">
        <div className="mb-5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={activeTab === 'reviews' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
          </Button>
          <Button
            type="button"
            variant={activeTab === 'related' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('related')}
          >
            Related Products
          </Button>
        </div>

        {activeTab === 'related' ? (
          <div className="bg-white p-6 rounded-lg shadow">
            {relatedProducts.length === 0 ? (
              <InfoMessage
                message="No related products available for this item yet."
                variant="muted"
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
                <aside className="pt-11">
                  <FilterSidebar sections={relatedFilterSections} />
                </aside>

                <section>
                  <div className="mb-3 flex min-h-8 justify-end">
                    <ClearFiltersButton
                      onClear={clearRelatedFilters}
                      className={hasActiveRelatedFilters ? '' : 'invisible pointer-events-none'}
                    />
                  </div>
                  <ProductGrid
                    products={filteredRelatedProducts}
                    emptyMessage="No related products match the selected filters."
                    userId={userId}
                    favoriteProductIds={favoriteProductIds}
                    activeColorFilter={relatedColor}
                    compact
                  />
                </section>
              </div>
            )}
          </div>
        ) : (
          product && (
            <ReviewsSection
              productId={parseInt(id || '0', 10)}
              userId={userId ? parseInt(userId, 10) : undefined}
              ratingAvg={product.ratingAvg || 0}
              ratingCount={product.ratingCount || 0}
              reviews={product.reviews || []}
              onReviewSubmitted={fetchProduct}
            />
          )
        )}
      </div>
    </main>
  );
}
