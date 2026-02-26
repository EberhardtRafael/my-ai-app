import type React from 'react';
import type { Product } from '@/utils/fetchProducts';
import ProductCard from './ProductCard';
import InfoMessage from './ui/InfoMessage';
import ProductCardCompact from './ui/ProductCardCompact';

type ProductGridProps = {
  products: Product[];
  emptyMessage?: string;
  userId?: string;
  favoriteProductIds?: number[];
  assistantSession?: string;
  assistantRecommendedIds?: number[];
  activeColorFilter?: string;
  compact?: boolean;
  className?: string;
};

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  emptyMessage = 'No products found.',
  userId,
  favoriteProductIds = [],
  assistantRecommendedIds = [],
  activeColorFilter = '',
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={
        compact
          ? `grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 ${className}`
          : `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 ${className}`
      }
    >
      {products.length === 0 ? (
        <div className="col-span-full">
          <InfoMessage message={emptyMessage} />
        </div>
      ) : (
        products.map((product) => {
          const normalizedActiveColor = activeColorFilter.toLowerCase();
          const matchingVariantColor = product.variants?.find(
            (variant: any) => (variant?.color || '').toLowerCase() === normalizedActiveColor
          )?.color;
          const firstColor = product.variants?.[0]?.color;
          const displayColor = matchingVariantColor || firstColor;
          const isAssistantRecommended = assistantRecommendedIds.includes(product.id as number);

          if (compact) {
            return (
              <ProductCardCompact
                key={product.id}
                id={product.id}
                name={product.name}
                category={product.category}
                price={product.price}
                userId={userId}
                initialIsFavorite={favoriteProductIds.includes(product.id as number)}
                color={displayColor}
              />
            );
          }

          return (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              category={product.category}
              price={product.price}
              brand={product.brand}
              ratingAvg={product.ratingAvg}
              ratingCount={product.ratingCount}
              userId={userId}
              initialIsFavorite={favoriteProductIds.includes(product.id as number)}
              color={displayColor}
              isAssistantRecommended={isAssistantRecommended}
            />
          );
        })
      )}
    </div>
  );
};

export default ProductGrid;
