import { useLocalization } from '@/contexts/LocalizationContext';

type LoadingSpinnerProps = {
  message?: string;
  className?: string;
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  className = '',
}) => {
  const { t } = useLocalization();

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      {(message || t('common.loading')) && (
        <span className="ml-3 text-gray-600">{message || t('common.loading')}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;
