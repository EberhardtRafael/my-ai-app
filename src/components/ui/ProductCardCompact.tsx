'use client';

import Link from 'next/link';
import type React from 'react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import ProductPrice from '@/components/ui/ProductPrice';
import { useFavorites } from '@/contexts/FavoritesContext';
import { HeartFilledIcon, HeartIcon } from '@/icons/HeartIcon';
import { getProductImageUrl } from '@/utils/colorUtils';

type ProductCardCompactProps = {
  id?: number | string;
  name?: string;
  category?: string;
  price?: number | string;
  className?: string;
  userId?: string;
  initialIsFavorite?: boolean;
  color?: string;
};

const ProductCardCompact: React.FC<ProductCardCompactProps> = ({
  id,
  name,
  price,
  className = '',
  userId,
  initialIsFavorite = false,
  color,
}) => {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);
  const { setFavoritesCount } = useFavorites();

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!userId || !id) return;

    setLoading(true);
    try {
      const mutation = isFavorite
        ? `mutation { removeFavorite(userId: ${userId}, productId: ${id}) }`
        : `mutation { addFavorite(userId: ${userId}, productId: ${id}) { favorite { id } totalCount } }`;

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation }),
      });

      const result = await response.json();

      if (result.data) {
        const newIsFavorite = !isFavorite;
        setIsFavorite(newIsFavorite);

        const countQuery = `{ favorites(userId: ${userId}, activeOnly: true) { id } }`;
        const countResponse = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: countQuery }),
        });
        const countResult = await countResponse.json();
        const newCount = countResult?.data?.favorites?.length || 0;
        setFavoritesCount(newCount);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = getProductImageUrl(color || 'default');
  const productUrl = `/pdp/${id}`;

  return (
    <Link href={productUrl} className={`block ${className}`}>
      <div className="bg-white rounded overflow-hidden hover:shadow-md transition-shadow duration-200 border border-gray-200 h-full">
        {/* Tiny Image */}
        <div className="relative aspect-video bg-gray-100">
          <img src={imageUrl} alt={name || 'Product'} className="w-full h-full object-cover" />
          {userId && (
            <Button
              type="button"
              onClick={handleToggleFavorite}
              disabled={loading}
              variant="ghost"
              className="absolute top-1 right-1 p-0.5 bg-white shadow-sm hover:shadow-md"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? (
                <HeartFilledIcon className="w-2.5 h-2.5 text-red-500" />
              ) : (
                <HeartIcon className="w-2.5 h-2.5 text-gray-600" />
              )}
            </Button>
          )}
        </div>

        {/* Tiny Info */}
        <div className="p-1.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex-1 min-w-0">
              <h3 className="text-[11px] font-semibold text-gray-900 truncate leading-tight">
                {name}
              </h3>
            </div>
            <ProductPrice price={price} className="text-xs leading-tight whitespace-nowrap" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCardCompact;
