'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { HeartIcon } from '@/icons/HeartIcon';
import Dropdown from './ui/Dropdown';
import SearchBox from './ui/SearchBox';
import Toast from './ui/Toast';
import Tooltip from './ui/Tooltip';
import { useToast } from './ui/useToast';

export default function Header() {
  const { data: session } = useSession();
  const { favoritesCount, setFavoritesCount } = useFavorites();
  const { cartItemsCount, setCartItemsCount } = useCart();
  const toast = useToast();
  const homeText = 'Home';
  const productsText = 'Products';
  const searchPlaceholder = 'Search product by name or property';

  const pathname = usePathname();
  const router = useRouter();

  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const [searchValue, setSearchValue] = useState<string>(search);

  useEffect(() => {
    setSearchValue(search);
  }, [searchParams]);

  // Fetch favorites count
  const fetchFavoritesCount = useCallback(async () => {
    if (!session?.user?.id) {
      setFavoritesCount(0);
      return;
    }

    try {
      const query = `{ favorites(userId: ${session.user.id}, activeOnly: true) { id } }`;
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const result = await response.json();
      const favorites = result?.data?.favorites || [];
      setFavoritesCount(favorites.length);
    } catch (error) {
      console.error('Error fetching favorites count:', error);
    }
  }, [session?.user?.id, setFavoritesCount]);

  useEffect(() => {
    fetchFavoritesCount();
  }, [fetchFavoritesCount]);

  // Fetch cart items count
  const fetchCartCount = useCallback(async () => {
    if (!session?.user?.id) {
      setCartItemsCount(0);
      return;
    }

    try {
      const query = `
        query GetCart($userId: Int!) {
          cart(userId: $userId) { 
            items { 
              id 
              quantity 
            } 
          } 
        }
      `;

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { userId: parseInt(session.user.id) } }),
      });
      const result = await response.json();
      const items = result?.data?.cart?.items || [];
      const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartItemsCount(totalItems);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  }, [session?.user?.id, setCartItemsCount]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  const onSearchChange = (searchTerm: string) => {
    setSearchValue(searchTerm);
    if (!searchTerm) onSearch('');
  };

  const onSearch = (searchTerm: string) => {
    const params = new URLSearchParams();
    searchTerm && params.set('search', searchTerm);
    !searchTerm && params.delete('search');
    router.push(`/plp?${params.toString()}`);
  };

  const dropdownItems = [
    {
      label: 'Profile',
      onClick: () => toast.info('Coming Soon', 'Profile page coming soon!'),
    },
    {
      label: 'Sign Out',
      onClick: () => signOut(),
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full flex justify-between items-center p-4 bg-gray-100 shadow-sm text-gray-700 text-sm">
        {/* Left Region */}
        <nav className="flex gap-4 items-center">
          <Link href="/">
            <Button disabled={pathname === '/'}>{homeText}</Button>
          </Link>
          <Link href="/plp">
            <Button disabled={pathname === '/plp'}>{productsText}</Button>
          </Link>
          <Link href="/favorites">
            <Button className="flex items-center gap-2 relative">
              <HeartIcon className="w-4 h-4" />
              <span>Favorites</span>
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </Button>
          </Link>
          {session && (
            <Link href="/orders">
              <Button disabled={pathname === '/orders'}>Orders</Button>
            </Link>
          )}
        </nav>

        {/* Right Region */}
        <div className="flex items-center gap-4 ml-auto">
          <SearchBox
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={onSearchChange}
            onSearch={onSearch}
          />
          {session && (
            <>
              <Link href="/cart">
                <Tooltip text="Shopping Cart">
                  <button
                    type="button"
                    className="p-2 hover:text-gray-500 transition-colors relative"
                    aria-label="Cart"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>Shopping Cart</title>
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartItemsCount}
                      </span>
                    )}
                  </button>
                </Tooltip>
              </Link>

              {/* User Dropdown */}
              <Dropdown
                items={dropdownItems}
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <span className="text-sm whitespace-nowrap">
                      {session.user?.name || session.user?.email}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <title>User menu</title>
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                }
              />
            </>
          )}
        </div>
      </header>
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
}
