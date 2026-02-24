import type React from 'react';

type OrderSummaryLine = {
  label: string;
  value: string | number;
  isBold?: boolean;
  hasBorder?: boolean;
};

type OrderSummaryProps = {
  subtotal: number;
  shipping: number;
  tax: number;
  itemCount?: number;
};

const OrderSummary: React.FC<OrderSummaryProps> = ({ subtotal, shipping, tax, itemCount }) => {
  const total = subtotal + shipping + tax;

  const lines: OrderSummaryLine[] = [
    {
      label: itemCount ? `Subtotal (${itemCount} items)` : 'Subtotal',
      value: `$${subtotal.toFixed(2)}`,
    },
    {
      label: 'Shipping',
      value: shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`,
    },
    {
      label: 'Tax (10%)',
      value: `$${tax.toFixed(2)}`,
    },
    {
      label: 'Total',
      value: `$${total.toFixed(2)}`,
      isBold: true,
      hasBorder: true,
    },
  ];

  return (
    <div className="space-y-2">
      {lines.map((line) => (
        <div
          key={line.label}
          className={`flex justify-between ${line.hasBorder ? 'border-t border-gray-300 pt-2' : ''} ${line.isBold ? 'font-semibold text-gray-800' : 'text-gray-700'}`}
        >
          <span>{line.label}</span>
          <span>{line.value}</span>
        </div>
      ))}
    </div>
  );
};

export default OrderSummary;
