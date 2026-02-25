import Button from './Button';
import Icon from './Icon';
import { useLocalization } from '@/contexts/LocalizationContext';

type ClearFiltersButtonProps = {
  onClear: () => void;
  className?: string;
};

export default function ClearFiltersButton({ onClear, className = '' }: ClearFiltersButtonProps) {
  const { t } = useLocalization();

  return (
    <Button
      type="button"
      variant="ghost"
      className={`px-2 py-1 text-sm text-gray-700 hover:text-gray-900 ${className}`}
      onClick={onClear}
    >
      <Icon name="plus" size={16} className="rotate-45" />
      {t('plp.clearAllFilters')}
    </Button>
  );
}
