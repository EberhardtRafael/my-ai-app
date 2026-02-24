'use client';

import Link from 'next/link';
import type React from 'react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useFavorites } from '@/contexts/FavoritesContext';
import { HeartFilledIcon, HeartIcon } from '@/icons/HeartIcon';
import { getProductImageUrl } from '@/utils/colorUtils';

type ProductCardProps = {
  id?: number | string;
  name?: string;
  category?: string;
  price?: number | string;
  brand?: string;
  rating_avg?: number;
  rating_count?: number;
  className?: string;
  userId?: string;
  initialIsFavorite?: boolean;
  color?: string;
};

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  category,
  price,
  brand,
  rating_avg,
  rating_count,
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
        setIsFavorite(!isFavorite);

        // Always fetch the actual count to ensure accuracy
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

  return (
    <div className={`bg-white p-4 rounded-md shadow hover:shadow-lg transition ${className}`}>
      <div className="h-40 mb-4 rounded-md overflow-hidden">
        <img
          src={getProductImageUrl(color, 400, 400)}
          alt={name || 'Product'}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product info and favorite button side by side */}
      <div className="flex justify-between items-start">
        <Link href={`/pdp/${id}`} className="flex-1">
          <div>
            {brand && <p className="text-xs text-gray-400 uppercase tracking-wide">{brand}</p>}
            <h2 className="font-semibold">{name}</h2>
            <p className="text-gray-500 text-sm">{category}</p>
            {rating_avg !== undefined && rating_avg > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm font-medium">{rating_avg.toFixed(1)}</span>
                {rating_count !== undefined && rating_count > 0 && (
                  <span className="text-xs text-gray-400">({rating_count})</span>
                )}
              </div>
            )}
            <p className="font-bold mt-2">${price}</p>
          </div>
        </Link>

        {/* Favorite Button */}
        {userId && (
          <Button
            type="button"
            onClick={handleToggleFavorite}
            disabled={loading}
            variant="ghost"
            className="p-2 flex-shrink-0 ml-2"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? <HeartFilledIcon /> : <HeartIcon />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
