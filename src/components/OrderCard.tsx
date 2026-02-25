import Card from '@/components/ui/Card';
import OrderHeader from '@/components/OrderHeader';
import OrderItemRow from '@/components/OrderItemRow';
import OrderShippingInfo from '@/components/OrderShippingInfo';
import OrderPaymentSummary from '@/components/OrderPaymentSummary';
import type { Order } from '@/utils/fetchOrders';

type OrderCardProps = {
  order: Order;
};

export default function OrderCard({ order }: OrderCardProps) {
  return (
    <Card>
      <div className="space-y-4">
        <OrderHeader
          id={order.id}
          status={order.status}
          created_at={order.created_at}
          total={order.total}
        />

        <div className="space-y-3">
          {order.items.map((item) => (
            <OrderItemRow
              key={item.id}
              product_name={item.product_name}
              color={item.color}
              size={item.size}
              quantity={item.quantity}
              price={item.price}
            />
          ))}
        </div>

        <OrderShippingInfo
          full_name={order.full_name}
          address={order.address}
          city={order.city}
          postal_code={order.postal_code}
          country={order.country}
          phone={order.phone}
        />

        <OrderPaymentSummary
          card_last4={order.card_last4}
          subtotal={order.subtotal}
          tax={order.tax}
          shipping={order.shipping}
        />
      </div>
    </Card>
  );
}
