import type React from 'react';
import type { Product } from '@/utils/fetchProducts';
import ProductCard from './ProductCard';
import InfoMessage from './ui/InfoMessage';

type ProductGridProps = {
  products: Product[];
  emptyMessage?: string;
  userId?: string;
  favoriteProductIds?: number[];
};

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  emptyMessage = 'No products found.',
  userId,
  favoriteProductIds = [],
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.length === 0 ? (
        <div className="col-span-full">
          <InfoMessage message={emptyMessage} />
        </div>
      ) : (
        products.map((product) => {
          const firstColor = product.variants?.[0]?.color;
          return (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              category={product.category}
              price={product.price}
              userId={userId}
              initialIsFavorite={favoriteProductIds.includes(product.id as number)}
              color={firstColor}
            />
          );
        })
      )}
    </div>
  );
};

export default ProductGrid;
