import { useLocalization } from '@/contexts/LocalizationContext';
import { formatDate, getStatusColor } from '@/utils/orderUtils';

type OrderHeaderProps = {
  id: number;
  status: string;
  created_at: string;
  total: number;
};

export default function OrderHeader({ id, status, created_at, total }: OrderHeaderProps) {
  const { t } = useLocalization();

  return (
    <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-gray-200">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-gray-800">
            {t('orders.orderPrefix')} #{id}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <p className="text-sm text-gray-600">{formatDate(created_at)}</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-600">{t('orders.total')}</p>
        <p className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</p>
      </div>
    </div>
  );
}
