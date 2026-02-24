import type React from 'react';
import ButtonGroup from '@/components/ui/ButtonGroup';

type OptionSelectorProps = {
  label: string;
  options: string[];
  selectedOption: string | null;
  onSelect: (option: string) => void;
};

const OptionSelector: React.FC<OptionSelectorProps> = ({
  label,
  options,
  selectedOption,
  onSelect,
}) => {
  if (options.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold mb-2">{label}</h3>
      <ButtonGroup
        options={options}
        selectedValue={selectedOption ?? undefined}
        onSelect={onSelect}
        size="sm"
      />
    </div>
  );
};

export default OptionSelector;
