import React from "react";

type SearchBoxProps = {
  value: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
};

const SearchBox = ({ value, onChange, onSearch, placeholder }: SearchBoxProps) => {
  return (
    <input
        type="text"
        value={value}
        onChange={e => onChange?.(e.target.value)}
        onKeyDown={e => {
            if(e.key === "Enter") onSearch?.(value)
        }}
        placeholder={placeholder}
        className="border border-gray-500 text-gray-700 placeholder-gray-400 rounded-xl px-2 py-1"
    />
  );
}

export default SearchBox;
