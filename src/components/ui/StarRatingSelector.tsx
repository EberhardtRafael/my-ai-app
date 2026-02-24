import { useState } from 'react';
import Button from './Button';
import StarIcon from '@/icons/StarIcon';

type StarRatingSelectorProps = {
  value: number;
  onChange: (rating: number) => void;
  className?: string;
};

export default function StarRatingSelector({ 
  value, 
  onChange,
  className = '' 
}: StarRatingSelectorProps) {
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          key={star}
          type="button"
          variant="ghost"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(0)}
          className="p-0 text-2xl transition-transform hover:scale-110"
        >
          <StarIcon filled={star <= (hoveredRating || value)} />
        </Button>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {value} star{value !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
