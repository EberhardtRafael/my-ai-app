import Button from './Button';

type PaginationDotsProps = {
  total: number;
  currentIndex: number;
  onDotClick: (index: number) => void;
  className?: string;
};

export default function PaginationDots({
  total,
  currentIndex,
  onDotClick,
  className = '',
}: PaginationDotsProps) {
  if (total <= 1) return null;

  return (
    <div className={`flex justify-center gap-2 mt-4 ${className}`}>
      {Array.from({ length: total }).map((_, index) => (
        <Button
          // biome-ignore lint/suspicious/noArrayIndexKey: Dot indicators are positional and stable
          key={`dot-${index}`}
          type="button"
          onClick={() => onDotClick(index)}
          variant="ghost"
          className={`w-2 h-2 rounded-full transition-colors ${
            index === currentIndex ? 'bg-gray-700' : 'bg-gray-300'
          }`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}
