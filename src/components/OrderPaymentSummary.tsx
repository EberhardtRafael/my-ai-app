import { useLocalization } from '@/contexts/LocalizationContext';

type OrderPaymentSummaryProps = {
  card_last4: string;
  subtotal: number;
  tax: number;
  shipping: number;
};

export default function OrderPaymentSummary({
  card_last4,
  subtotal,
  tax,
  shipping,
}: OrderPaymentSummaryProps) {
  const { t } = useLocalization();

  const paymentBreakdownLines = [
    {
      key: 'subtotal',
      label: t('orders.subtotal'),
      value: `$${subtotal.toFixed(2)}`,
    },
    { key: 'tax', label: t('orders.tax'), value: `$${tax.toFixed(2)}` },
    {
      key: 'shipping',
      label: t('orders.shipping'),
      value: shipping === 0 ? t('orders.freeShipping') : `$${shipping.toFixed(2)}`,
    },
  ];

  return (
    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-600">{t('orders.paymentMasked', { last4: card_last4 })}</p>
      </div>
      <div className="text-right text-sm">
        {paymentBreakdownLines.map((line) => (
          <div key={line.key} className="flex justify-between gap-8">
            <span className="text-gray-600">{line.label}:</span>
            <span className="text-gray-800">{line.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
