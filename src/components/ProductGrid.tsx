import type React from 'react';
import type { Product } from '@/utils/fetchProducts';
import ProductCard from './ProductCard';
import InfoMessage from './ui/InfoMessage';

type ProductGridProps = {
  products: Product[];
  emptyMessage?: string;
  userId?: string;
  favoriteProductIds?: number[];
  assistantSession?: string;
  assistantRecommendedIds?: number[];
  activeColorFilter?: string;
};

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  emptyMessage = 'No products found.',
  userId,
  favoriteProductIds = [],
  assistantRecommendedIds = [],
  activeColorFilter = '',
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
