import Button from './Button';

type ButtonOption = {
  value: string;
  label?: string;
};

type ButtonGroupProps = {
  options: string[] | ButtonOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export default function ButtonGroup({
  options,
  selectedValue,
  onSelect,
  variant = 'secondary',
  size = 'sm',
  className = '',
}: ButtonGroupProps) {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label || option.value;
        const isSelected = selectedValue === value;

        return (
          <Button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            variant={isSelected ? 'primary' : variant}
            className={sizeClasses[size]}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
