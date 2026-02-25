import Button from './Button';

type CaterpillarItem = {
  value: string;
  label: string;
};

type CaterpillarMenuProps = {
  items: CaterpillarItem[];
  selectedValue: string;
  onSelect: (value: string) => void;
};

export default function CaterpillarMenu({ items, selectedValue, onSelect }: CaterpillarMenuProps) {
  return (
    <div className="flex flex-col sm:flex-row divide-x divide-gray-200">
      {items.map((item, index) => (
        <Button
          key={item.value || '__all__'}
          onClick={() => onSelect(item.value)}
          className={
            selectedValue === item.value
              ? `${index !== 0 && index !== items.length - 1 ? 'sm:rounded-none' : ''} ${index === 0 ? 'sm:rounded-r-none' : ''} ${index === items.length - 1 ? 'sm:rounded-l-none' : ''} font-semibold bg-gray-300 text-black hover:bg-gray-300 hover:text-black`
              : `${index !== 0 && index !== items.length - 1 ? 'sm:rounded-none' : ''} ${index === 0 ? 'sm:rounded-r-none' : ''} ${index === items.length - 1 ? 'sm:rounded-l-none' : ''} bg-gray-300 text-gray-700 hover:bg-gray-200 hover:text-gray-900 hover:font-medium`
          }
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
