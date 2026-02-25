type StarIconProps = {
  filled?: boolean;
  className?: string;
};

export default function StarIcon({ filled = false, className = '' }: StarIconProps) {
  return <span className={`${filled ? 'text-yellow-500' : 'text-gray-300'} ${className}`}>★</span>;
}
