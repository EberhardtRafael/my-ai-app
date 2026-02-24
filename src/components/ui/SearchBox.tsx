import { useEffect, useRef, useState } from 'react';

type SearchBoxProps = {
  value: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
};

const SearchBox = ({ value, onChange, onSearch, placeholder }: SearchBoxProps) => {
  const [localValue, setLocalValue] = useState(value);
  const previousValue = useRef<string | null>(null);
  const hasUserInteracted = useRef(false);

  //When page loads with URL param, apply it
  useEffect(() => {
    setLocalValue(value);
    // If there's an initial value from URL, set previousValue to track it
    if (value && previousValue.current === null) {
      previousValue.current = value;
    }
  }, [value]);

  //While typing, search with debounce (500ms)
  //Empty only triggers if previous was non-empty
  useEffect(() => {
    // Skip if user hasn't interacted yet and both are empty (initial load with no search)
    if (!hasUserInteracted.current && previousValue.current === null && localValue === '') {
      return;
    }

    // Don't trigger empty search if previous was also empty OR if previous was null
    if ((previousValue.current === '' || previousValue.current === null) && localValue === '') {
      return;
    }

    const timeoutId = setTimeout(() => {
      onSearch?.(localValue);
      previousValue.current = localValue;
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localValue, onSearch]);

  return (
    <input
      type="text"
      value={localValue}
      onChange={(e) => {
        hasUserInteracted.current = true;
        const newValue = e.target.value;
        setLocalValue(newValue);
        onChange?.(newValue);
      }}
      onKeyDown={(e) => {
        //On Enter, search immediately
        if (e.key === 'Enter') {
          hasUserInteracted.current = true;
          onSearch?.(localValue);
          previousValue.current = localValue;
        }
      }}
      placeholder={placeholder}
      className="border border-gray-500 text-gray-700 placeholder-gray-400 rounded-xl px-2 py-1"
    />
  );
};

export default SearchBox;
