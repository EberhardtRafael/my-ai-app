'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { JSON_HEADERS } from '@/constants/http';
import { useCart } from '@/contexts/CartContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useLocalization } from '@/contexts/LocalizationContext';
import { usePlpSearchState } from '@/contexts/PlpSearchStateContext';
import { useProfile } from '@/contexts/ProfileContext';
import { getEffectiveUserId } from '@/utils/guestSessionClient';
import Dropdown from './ui/Dropdown';
import SearchBox from './ui/SearchBox';
import Toast from './ui/Toast';
import Tooltip from './ui/Tooltip';
import { useToast } from './ui/useToast';

type DevModeState = {
  enabled: boolean;
  available: boolean;
  forced: boolean;
  role?: 'user' | 'dev';
};

export default function Header() {
  const { data: session } = useSession();
  const { favoritesCount, setFavoritesCount } = useFavorites();
  const { cartItemsCount, setCartItemsCount } = useCart();
  const { setHasPendingSearch } = usePlpSearchState();
  const { displayName } = useProfile();
  const { t } = useLocalization();
  const toast = useToast();

  const pathname = usePathname();
  const router = useRouter();

  const searchParams = useSearchParams();
  const search = searchParams.get('search') || '';

  const [searchValue, setSearchValue] = useState<string>(search);
  const [devModeState, setDevModeState] = useState<DevModeState>({
    enabled: false,
    available: false,
    forced: false,
  });
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(null);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [isTogglingDevMode, setIsTogglingDevMode] = useState<boolean>(false);

  useEffect(() => {
    const resolveUserId = async () => {
      const userId = await getEffectiveUserId(session?.user?.id ?? null);
      setEffectiveUserId(userId);
    };

    resolveUserId();
  }, [session?.user?.id]);

  useEffect(() => {
    const loadGuestModeState = async () => {
      if (session?.user?.id) {
        setIsGuestMode(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/guest-session?create=false', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          setIsGuestMode(false);
          return;
        }

        const payload = await response.json();
        setIsGuestMode(Boolean(payload?.isGuest));
      } catch {
        setIsGuestMode(false);
      }
    };

    loadGuestModeState();
  }, [session?.user?.id]);

  useEffect(() => {
    setSearchValue(search);
  }, [searchParams]);

  useEffect(() => {
    const loadDevModeState = async () => {
      try {
        const response = await fetch('/api/dev/mode', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as DevModeState;
        setDevModeState(payload);
      } catch {
        setDevModeState({ enabled: false, available: false, forced: false });
      }
    };

    loadDevModeState();
  }, []);

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
        headers: JSON_HEADERS,
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
    if (!effectiveUserId) {
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
        headers: JSON_HEADERS,
        body: JSON.stringify({ query, variables: { userId: parseInt(effectiveUserId, 10) } }),
      });
      const result = await response.json();
      const items = result?.data?.cart?.items || [];
      const totalItems = items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartItemsCount(totalItems);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  }, [effectiveUserId, setCartItemsCount]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  const onSearchChange = (searchTerm: string) => {
    setSearchValue(searchTerm);
    if (!searchTerm) onSearch('');
  };

  const onSearch = (searchTerm: string) => {
    setHasPendingSearch(Boolean(searchTerm.trim()));

    const params = new URLSearchParams();
    searchTerm && params.set('search', searchTerm);
    !searchTerm && params.delete('search');
    router.push(`/plp?${params.toString()}`);
  };

  const dropdownItems = [
    {
      label: t('common.profile'),
      onClick: () => router.push('/profile'),
    },
    {
      label: t('common.signOut'),
      onClick: () => signOut(),
    },
  ];

  const handleToggleDeveloperMode = async () => {
    if (!devModeState.available || devModeState.forced) {
      return;
    }

    setIsTogglingDevMode(true);

    try {
      const response = await fetch('/api/dev/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !devModeState.enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle developer mode');
      }

      const payload = (await response.json()) as DevModeState;
      setDevModeState(payload);
      router.refresh();
    } catch (error) {
      console.error('Error toggling developer mode:', error);
      toast.error('Error', 'Failed to toggle developer mode');
    } finally {
      setIsTogglingDevMode(false);
    }
  };

  const handleExitGuestMode = async () => {
    try {
      const response = await fetch('/api/auth/guest-session', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to exit guest mode');
      }

      setIsGuestMode(false);
      setEffectiveUserId(null);
      setCartItemsCount(0);
      router.push('/auth/signin');
      router.refresh();
    } catch (error) {
      console.error('Error exiting guest mode:', error);
      toast.error('Error', 'Failed to exit guest mode');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full flex justify-between items-center p-4 bg-gray-100 shadow-sm text-gray-700 text-sm">
        {/* Left Region */}
        <nav className="flex gap-4 items-center">
          <Link href="/">
            <Button disabled={pathname === '/'}>{t('common.home')}</Button>
          </Link>
          <Link href="/plp">
            <Button disabled={pathname === '/plp'}>{t('common.products')}</Button>
          </Link>
          {session && (
            <Link href="/favorites">
              <Button className="flex items-center gap-2 relative">
                <Icon name="heart" size={16} />
                <span>{t('common.favorites')}</span>
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </Button>
            </Link>
          )}
          {session && (
            <>
              <Link href="/orders">
                <Button disabled={pathname === '/orders'}>{t('common.orders')}</Button>
              </Link>
              <Link href="/assistant">
                <Button disabled={pathname === '/assistant'}>{t('common.assistant')}</Button>
              </Link>
              {devModeState.enabled && (
                <>
                  <Link href="/tickets">
                    <Button disabled={pathname === '/tickets'}>
                      <span className="flex items-center gap-2">
                        <Icon name="document-text" size={16} />
                        {t('common.tickets')}
                      </span>
                    </Button>
                  </Link>
                  <Link href="/dev/testing">
                    <Button disabled={pathname === '/dev/testing'}>{t('common.devLab')}</Button>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Right Region */}
        <div className="flex items-center gap-4 ml-auto">
          <SearchBox
            value={searchValue}
            placeholder={t('header.searchPlaceholder')}
            onChange={onSearchChange}
            onSearch={onSearch}
          />
          <Link href="/cart">
            <Tooltip text={t('header.shoppingCartTooltip')}>
              <Button
                type="button"
                variant="ghost"
                className="p-2 hover:text-gray-500 transition-colors relative"
                aria-label={t('header.cartAriaLabel')}
              >
                <Icon name="cart" size={24} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </Tooltip>
          </Link>

          {session && (
            <>
              {(devModeState.available || devModeState.enabled) && (
                <Button
                  variant={devModeState.enabled ? 'primary' : 'secondary'}
                  disabled={isTogglingDevMode || devModeState.forced}
                  onClick={handleToggleDeveloperMode}
                >
                  {isTogglingDevMode
                    ? t('common.devModeSwitching')
                    : devModeState.enabled
                      ? t('common.devModeOn')
                      : t('common.devModeOff')}
                </Button>
              )}

              {/* User Dropdown */}
              <Dropdown
                items={dropdownItems}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex items-center gap-2 px-3 py-2"
                  >
                    <span className="text-sm whitespace-nowrap">{displayName || session.user?.email}</span>
                    <Icon name="chevron-down" size={16} />
                  </Button>
                }
              />
            </>
          )}

          {!session && (
            <>
              {isGuestMode && (
                <Button type="button" variant="secondary" onClick={handleExitGuestMode}>
                  {t('common.exitGuestMode')}
                </Button>
              )}
              <Link href="/auth/signin">
                <Button>{t('common.signIn')}</Button>
              </Link>
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
