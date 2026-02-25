'use client';

import Link from 'next/link';
import type React from 'react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import ProductBrand from '@/components/ui/ProductBrand';
import ProductPrice from '@/components/ui/ProductPrice';
import ProductRating from '@/components/ui/ProductRating';
import ProductTitle from '@/components/ui/ProductTitle';
import { useFavorites } from '@/contexts/FavoritesContext';
import { getProductImageUrl } from '@/utils/colorUtils';

type ProductCardProps = {
  id?: number | string;
  name?: string;
  category?: string;
  price?: number | string;
  brand?: string;
  ratingAvg?: number;
  ratingCount?: number;
  className?: string;
  userId?: string;
  initialIsFavorite?: boolean;
  color?: string;
  isAssistantRecommended?: boolean;
};

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  category,
  price,
  brand,
  ratingAvg,
  ratingCount,
  className = '',
  userId,
  initialIsFavorite = false,
  color,
  isAssistantRecommended = false,
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
            {isAssistantRecommended && (
              <span className="inline-flex items-center text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded mb-2">
                Assistant Pick
              </span>
            )}
            <ProductBrand brand={brand} />
            <ProductTitle name={name} category={category} />
            <ProductRating rating={ratingAvg} count={ratingCount} className="mt-1" />
            <ProductPrice price={price} className="mt-2" />
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
            <Icon name={isFavorite ? 'heart-filled' : 'heart'} size={20} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
