import ProductPrice from '@/components/ui/ProductPrice';
import { useLocalization } from '@/contexts/LocalizationContext';
import { getProductImageUrl } from '@/utils/colorUtils';

type OrderItemRowProps = {
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
};

export default function OrderItemRow({
  product_name,
  color,
  size,
  quantity,
  price,
}: OrderItemRowProps) {
  const { t } = useLocalization();

  return (
    <div className="flex gap-4">
      <img
        src={getProductImageUrl(color, 100, 100)}
        alt={product_name}
        className="w-20 h-20 object-cover rounded"
      />
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800">{product_name}</h4>
        <p className="text-sm text-gray-600">
          {t('orders.color')}: {color} | {t('orders.size')}: {size}
        </p>
        <p className="text-sm text-gray-600">
          {t('orders.quantity', { count: quantity })}
        </p>
      </div>
      <div className="text-right">
        <ProductPrice price={(price * quantity).toFixed(2)} className="text-gray-800" />
        <p className="text-xs text-gray-500">
          {t('orders.priceEach', { price: price.toFixed(2) })}
        </p>
      </div>
    </div>
  );
}
