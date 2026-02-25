'use client';

import Icon from '@/components/ui/Icon';
import type { Review } from '@/utils/fetchReviews';
import { markReviewHelpful } from '@/utils/fetchReviews';
import Badge from './ui/Badge';
import Button from './ui/Button';
import Card from './ui/Card';
import EmptyState from './ui/EmptyState';
import ProductRating from './ui/ProductRating';

type ReviewListProps = {
  reviews: Review[];
};

export default function ReviewList({ reviews }: ReviewListProps) {
  const handleMarkHelpful = async (reviewId: number) => {
    try {
      await markReviewHelpful(reviewId);
      // Helpful count will be updated when product refetches
    } catch (err) {
      console.error('Error marking review as helpful:', err);
    }
  };

  return (
    <div className="space-y-4">
      {reviews.length === 0 && (
        <EmptyState title="No reviews yet" message="Be the first to review this product!" />
      )}

      {reviews.length > 0 &&
        reviews.map((review) => (
          <Card key={review.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">{review.username}</span>
                  {review.verifiedPurchase && <Badge variant="success">Verified Purchase</Badge>}
                </div>
                <ProductRating rating={review.rating} />
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>

            {review.title && <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>}

            {review.comment && <p className="text-gray-700 mb-4">{review.comment}</p>}

            <Button variant="ghost" onClick={() => handleMarkHelpful(review.id)}>
              <Icon name="thumbs-up" size={16} className="mr-1" /> Helpful ({review.helpfulCount})
            </Button>
          </Card>
        ))}
    </div>
  );
}
