import Checkbox from './Checkbox';

type FilterOption = {
  value: string;
  label: string;
};

type FilterOptionListProps = {
  options: FilterOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  idPrefix: string;
};

export default function FilterOptionList({
  options,
  selectedValue,
  onSelect,
  idPrefix,
}: FilterOptionListProps) {
  const visibleOptions = options.filter((option) => option.value !== '');

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => onSelect('')}
        className="w-full rounded-lg px-1.5 py-1 text-left text-sm leading-5 text-gray-700 transition hover:bg-gray-100"
      >
        Clear filter
      </button>
      <ul className="space-y-1.5">
        {visibleOptions.map((option) => {
          const isSelected = option.value === selectedValue;

          return (
            <li key={`${idPrefix}-${option.value || '__all__'}`}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(checked ? option.value : '')}
                label={option.label}
                className={`w-full px-1.5 py-1 ${
                  isSelected ? 'bg-gray-100 text-gray-800' : 'text-gray-700 hover:bg-gray-100'
                }`}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
