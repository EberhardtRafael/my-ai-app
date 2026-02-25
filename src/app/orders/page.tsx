'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import OrderCard from '@/components/OrderCard';
import EmptyState from '@/components/ui/EmptyState';
import PageShell from '@/components/ui/PageShell';
import { useLocalization } from '@/contexts/LocalizationContext';
import { fetchOrders, type Order } from '@/utils/fetchOrders';

export default function OrdersPage() {
  const { t } = useLocalization();
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!session?.user?.id) return;

    const data = await fetchOrders(parseInt(session.user.id, 10));
    const ordersData = data?.data?.orders || [];
    setOrders(ordersData);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    loadOrders();
  }, [session?.user?.id, loadOrders]);

  const showEmptyState = orders.length === 0 && !loading && session?.user;

  return (
    <PageShell
      title={t('orders.title')}
      requireAuth
      isAuthenticated={!!session?.user}
      loading={loading}
    >
      {showEmptyState ? (
        <EmptyState
          title={t('orders.emptyTitle')}
          message={t('orders.emptyMessage')}
          actionLabel={t('orders.browseProducts')}
          actionHref="/plp"
        />
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
