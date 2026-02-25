'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import CartItemRow from '@/components/CartItemRow';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Carousel from '@/components/ui/Carousel';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import OrderSummary from '@/components/ui/OrderSummary';
import PageShell from '@/components/ui/PageShell';
import ProductCardCompact from '@/components/ui/ProductCardCompact';
import Toast from '@/components/ui/Toast';
import { useToast } from '@/components/ui/useToast';
import { JSON_HEADERS } from '@/constants/http';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import {
  type CartItem,
  clearCart,
  fetchCart,
  removeFromCart,
  updateCartItem,
} from '@/utils/fetchCart';

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  variants: Array<{
    id: number;
    sku: string;
    color: string;
    size: string;
    stock: number;
  }>;
};

export default function CartPage() {
  const { t } = useLocalization();
  const { data: session } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { setCartItemsCount } = useCart();
  const { setFavoritesCount } = useFavorites();
  const toast = useToast();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadCart = useCallback(async () => {
    if (!session?.user?.id) return;

    const data = await fetchCart(parseInt(session.user.id, 10));
    const items = data?.data?.cart?.items || [];
    setCartItems(items);
    setLoading(false);

    // Update cart count in context
    const totalItems = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
    setCartItemsCount(totalItems);

    // Fetch ML recommendations based on cart
    if (items.length > 0) {
      loadRecommendations(parseInt(session.user.id, 10));
    }
  }, [session?.user?.id, setCartItemsCount]);

  const loadRecommendations = async (userId: number) => {
    try {
      const query = `
        query GetRecommendations($userId: Int!, $limit: Int!) {
          recommendations(userId: $userId, limit: $limit) {
            id
            name
            price
            category
            variants {
              id
              sku
              color
              size
              stock
            }
          }
        }
      `;

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ query, variables: { userId, limit: 4 } }),
      });

      const result = await response.json();
      const recommendedProducts = result?.data?.recommendations || [];
      setRecommendations(recommendedProducts);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    loadCart();
  }, [session?.user?.id, loadCart]);

  const handleQuantityChange = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    await updateCartItem(itemId, newQuantity);
    loadCart();
  };

  const handleRemoveItem = async (itemId: number) => {
    await removeFromCart(itemId);
    loadCart();
  };

  const handleSaveForLater = async (item: CartItem) => {
    if (!session?.user?.id) return;

    try {
      // Add to favorites
      const addFavoriteMutation = `mutation { addFavorite(userId: ${session.user.id}, productId: ${item.product.id}) { favorite { id } totalCount } }`;
      const favResponse = await fetch('/api/favorites', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ query: addFavoriteMutation }),
      });

      const favResult = await favResponse.json();

      if (favResult.data) {
        // Remove from cart
        await removeFromCart(item.id);
        loadCart();

        // Update favorites count
        const countQuery = `{ favorites(userId: ${session.user.id}, activeOnly: true) { id } }`;
        const countResponse = await fetch('/api/favorites', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({ query: countQuery }),
        });
        const countResult = await countResponse.json();
        const newCount = countResult?.data?.favorites?.length || 0;
        setFavoritesCount(newCount);

        toast.success(t('cart.savedForLaterTitle'), t('cart.savedForLaterMessage'));
      }
    } catch (error) {
      console.error('Error saving for later:', error);
      toast.error(t('cart.savedForLaterErrorTitle'), t('cart.savedForLaterErrorMessage'));
    }
  };

  const handleClearCart = async () => {
    if (!session?.user?.id) return;
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      toast.warning(t('cart.confirmActionTitle'), t('cart.confirmClearMessage'));
      return;
    }

    await clearCart(parseInt(session.user.id, 10));
    loadCart();
    setShowClearConfirm(false);
    toast.success(t('cart.cartClearedTitle'), t('cart.cartClearedMessage'));
  };

  const subtotal: number = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping: number = 0; // Free shipping
  const tax: number = subtotal * 0.1; // 10% tax
  const _total: number = subtotal + shipping + tax;

  const clearCartAction = cartItems.length > 0 && (
    <Button
      type="button"
      onClick={handleClearCart}
      variant="ghost"
      className="flex items-center gap-2 px-3 py-1.5 text-sm"
    >
      <Icon name="trash" size={16} />
      <span className="font-light">{t('cart.clearCart')}</span>
    </Button>
  );

  const showEmptyState = cartItems.length === 0;

  return (
    <PageShell
      title={t('cart.title')}
      requireAuth
      isAuthenticated={!!session?.user}
      loading={loading}
      headerAction={clearCartAction}
    >
      {showEmptyState ? (
        <EmptyState
          title={t('cart.emptyTitle')}
          message={t('cart.emptyMessage')}
          actionLabel={t('cart.browseProducts')}
          actionHref="/plp"
        />
      ) : (
        <>
          {/* ML-Powered Recommendations - Moved to top for visibility */}
          {recommendations.length > 0 && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="mb-2">
                <h2 className="text-base font-bold text-gray-900">{t('cart.recommendedForYou')}</h2>
                <p className="text-xs text-gray-600">{t('cart.basedOnCart')}</p>
              </div>
              <Carousel itemsPerView={6} gap={12}>
                {recommendations.map((product) => (
                  <ProductCardCompact
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    category={product.category}
                    color={product.variants[0]?.color}
                    userId={session?.user?.id}
                  />
                ))}
              </Carousel>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                  onSaveForLater={session?.user?.id ? handleSaveForLater : undefined}
                />
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card
                header={
                  <h2 className="text-xl font-bold text-gray-800">{t('cart.orderSummary')}</h2>
                }
                footer={
                  <>
                    <Link href="/checkout" className="block mt-3">
                      <Button className="w-full">{t('cart.proceedToCheckout')}</Button>
                    </Link>
                    <Link href="/plp" className="block mt-3">
                      <Button variant="secondary" className="w-full">
                        {t('cart.continueShopping')}
                      </Button>
                    </Link>
                  </>
                }
                className="sticky top-6"
              >
                <OrderSummary
                  subtotal={subtotal}
                  shipping={shipping}
                  tax={tax}
                  itemCount={cartItems.length}
                />
              </Card>
            </div>
          </div>
        </>
      )}

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
    </PageShell>
  );
}
