type ProductRatingProps = {
  rating?: number;
  count?: number;
  className?: string;
};

export default function ProductRating({ rating, count, className = '' }: ProductRatingProps) {
  if (rating === undefined || rating <= 0) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-yellow-500">★</span>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      {count !== undefined && count > 0 && <span className="text-xs text-gray-400">({count})</span>}
    </div>
  );
}
