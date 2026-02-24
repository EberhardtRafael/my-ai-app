'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageShell from '@/components/ui/PageShell';
import ProductPrice from '@/components/ui/ProductPrice';
import { getProductImageUrl } from '@/utils/colorUtils';
import { fetchOrders, type Order } from '@/utils/fetchOrders';

export default function OrdersPage() {
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (orders.length === 0 && !loading && session?.user) {
    return (
      <PageShell title="My Orders" requireAuth isAuthenticated={!!session?.user} loading={loading}>
        <EmptyState
          title="No orders yet"
          message="You haven't placed any orders. Start shopping to see your order history here."
          actionLabel="Browse Products"
          actionHref="/plp"
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="My Orders" requireAuth isAuthenticated={!!session?.user} loading={loading}>
      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <div className="space-y-4">
              {/* Order Header */}
              <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-gray-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-800">Order #{order.id}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={getProductImageUrl(item.color, 100, 100)}
                      alt={item.product_name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.product_name}</h4>
                      <p className="text-sm text-gray-600">
                        Color: {item.color} | Size: {item.size}
                      </p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <ProductPrice 
                        price={(item.price * item.quantity).toFixed(2)} 
                        className="text-gray-800"
                      />
                      <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Info */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Shipping Address</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{order.full_name}</p>
                  <p>{order.address}</p>
                  <p>
                    {order.city}, {order.postal_code}
                  </p>
                  <p>{order.country}</p>
                  <p>Phone: {order.phone}</p>
                </div>
              </div>

              {/* Payment Info */}
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Payment: •••• {order.card_last4}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="flex justify-between gap-8">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-800">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-800">${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="text-gray-800">
                      {order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
