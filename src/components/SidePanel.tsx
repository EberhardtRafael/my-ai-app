'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import OptionSelector from './OptionSelector';
import Button from './ui/Button';
import Card from './ui/Card';
import Toast from './ui/Toast';
import { useToast } from './ui/useToast';

type Variant = {
  id: number;
  sku: string;
  color: string;
  size: string;
  stock: number;
};

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  variants: Variant[];
};

type SidePanelProps = {
  productId?: string;
  userId?: string;
  cartUserId?: string;
  initialIsFavorite?: boolean;
  product?: Product;
  selectedColor?: string | null;
  selectedSize?: string | null;
  onColorChange?: (color: string) => void;
  onSizeChange?: (size: string) => void;
  onFavoriteChange?: (isFavorite: boolean) => void;
};

const SidePanel: React.FC<SidePanelProps> = ({
  productId,
  userId,
  cartUserId,
  initialIsFavorite = false,
  product,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  onFavoriteChange,
}) => {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { setFavoritesCount } = useFavorites();
  const { setCartItemsCount } = useCart();
  const toast = useToast();

  // Sync with parent's isFavorite changes
  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const handleToggleFavorite = async () => {
    if (!userId || !productId) return;

    setLoading(true);
    try {
      const mutation = isFavorite
        ? `mutation { removeFavorite(userId: ${userId}, productId: ${productId}) }`
        : `mutation { addFavorite(userId: ${userId}, productId: ${productId}) { favorite { id } totalCount } }`;

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation }),
      });

      const result = await response.json();

      if (result.data) {
        const newIsFavorite = !isFavorite;
        setIsFavorite(newIsFavorite);
        onFavoriteChange?.(newIsFavorite);

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

  const handleAddToCart = async () => {
    if (!cartUserId || !productId || !selectedColor || !selectedSize) {
      toast.warning('Selection Required', 'Please select a color and size');
      return;
    }

    // Find the matching variant
    const variant = product?.variants?.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );

    if (!variant) {
      toast.error('Variant Unavailable', 'Selected variant not available');
      return;
    }

    setAddingToCart(true);
    try {
      const mutation = `
        mutation AddToCart($userId: Int!, $productId: Int!, $variantId: Int!, $quantity: Int!) {
          addToCart(userId: $userId, productId: $productId, variantId: $variantId, quantity: $quantity) { 
            id 
            quantity
            orderId
            productId
            variantId
            price
            productName
            color
            size
            addedAt
          } 
        }
      `;

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: mutation,
          variables: {
            userId: Number.parseInt(cartUserId, 10),
            productId: Number.parseInt(productId, 10),
            variantId: variant.id,
            quantity: 1,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL error');
      }

      if (!result.data?.addToCart) {
        throw new Error('No data returned from server');
      }

      toast.success('Added to Cart', 'Item successfully added to your cart', undefined, {
        label: 'Go to Cart',
        onClick: () => {
          window.location.href = '/cart';
        },
      });

      // Fetch updated cart count
      const cartQuery = `
        query GetCart($userId: Int!) {
          cart(userId: $userId) { 
            items { 
              id 
              quantity 
            } 
          } 
        }
      `;

      const cartResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: cartQuery,
          variables: { userId: Number.parseInt(cartUserId, 10) },
        }),
      });
      const cartResult = await cartResponse.json();
      const items = cartResult?.data?.cart?.items || [];
      const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartItemsCount(totalItems);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed', 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // Get unique colors and sizes from variants
  const colors = product?.variants ? [...new Set(product.variants.map((v) => v.color))] : [];
  const sizes = product?.variants ? [...new Set(product.variants.map((v) => v.size))] : [];

  const header = (
    <div className="relative">
      {userId && (
        <Button
          type="button"
          onClick={handleToggleFavorite}
          disabled={loading}
          variant="ghost"
          className="absolute -top-2 -right-2 p-2"
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Icon
            name={isFavorite ? 'heart-filled' : 'heart'}
            size={20}
            className={isFavorite ? 'text-gray-700' : 'text-gray-400'}
          />
        </Button>
      )}
      <h2 className="text-sm font-bold mb-2">{product?.name || 'Product Name'}</h2>
      <p className="text-sm font-semibold text-gray-700">${product?.price || '0.00'}</p>
    </div>
  );

  const footer = (
    <Button
      className="w-full text-sm"
      onClick={handleAddToCart}
      disabled={addingToCart || !cartUserId || !selectedColor || !selectedSize}
    >
      {addingToCart ? 'Adding...' : 'Add to Cart'}
    </Button>
  );

  return (
    <>
      <Card header={header} footer={footer} className="h-full flex flex-col">
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-1">Category</h3>
          <p className="text-sm text-gray-600">{product?.category || 'N/A'}</p>
        </div>

        <OptionSelector
          label="Colors"
          options={colors}
          selectedOption={selectedColor || null}
          onSelect={onColorChange || (() => {})}
        />

        <OptionSelector
          label="Sizes"
          options={sizes}
          selectedOption={selectedSize || null}
          onSelect={onSizeChange || (() => {})}
        />
      </Card>
      {toast.toasts.map((t) => (
        <Toast
          key={t.id}
          title={t.title}
          message={t.message}
          type={t.type}
          duration={t.duration}
          action={t.action}
          onClose={() => toast.removeToast(t.id)}
        />
      ))}
    </>
  );
};

export default SidePanel;
