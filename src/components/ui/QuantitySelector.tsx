type QuantitySelectorProps = {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
};

const QuantitySelector = ({ value, onChange, min = 1, max }: QuantitySelectorProps) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (!max || value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!Number.isNaN(newValue) && newValue >= min && (!max || newValue <= max)) {
      onChange(newValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (Number.isNaN(newValue) || newValue < min) {
      onChange(min);
    } else if (max && newValue > max) {
      onChange(max);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-full px-1 border border-gray-300 h-7">
      <button
        type="button"
        onClick={handleDecrement}
        className="w-6 h-6 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm flex items-center justify-center"
        disabled={value <= min}
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="w-8 text-center text-gray-800 text-sm bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        min={min}
        max={max}
      />
      <button
        type="button"
        onClick={handleIncrement}
        className="w-6 h-6 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm flex items-center justify-center"
        disabled={max !== undefined && value >= max}
      >
        +
      </button>
    </div>
  );
};

export default QuantitySelector;
