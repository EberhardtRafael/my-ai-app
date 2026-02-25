import { useLocalization } from '@/contexts/LocalizationContext';

type OrderShippingInfoProps = {
  full_name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  phone: string;
};

export default function OrderShippingInfo({
  full_name,
  address,
  city,
  postal_code,
  country,
  phone,
}: OrderShippingInfoProps) {
  const { t } = useLocalization();

  const shippingAddressLines = [
    { key: 'name', text: full_name },
    { key: 'address', text: address },
    { key: 'city', text: `${city}, ${postal_code}` },
    { key: 'country', text: country },
    { key: 'phone', text: `${t('orders.phone')}: ${phone}` },
  ];

  return (
    <div className="pt-4 border-t border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-2">{t('orders.shippingAddress')}</h4>
      <div className="text-sm text-gray-600 space-y-1">
        {shippingAddressLines.map((line) => (
          <p key={line.key}>{line.text}</p>
        ))}
      </div>
    </div>
  );
}
