import type React from 'react';

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
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`px-3 py-1 text-xs rounded-md border transition ${
              selectedOption === option
                ? 'bg-gray-700 text-white border-black'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OptionSelector;
