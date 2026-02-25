'use client';

import type { Review } from '@/utils/fetchReviews';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';
import Card from './ui/Card';
import ProductRating from './ui/ProductRating';
import SectionHeader from './ui/SectionHeader';

type ReviewsSectionProps = {
  productId: number;
  userId?: number;
  ratingAvg: number;
  ratingCount: number;
  reviews: Review[];
  onReviewSubmitted?: () => void;
};

export default function ReviewsSection({
  productId,
  userId,
  ratingAvg,
  ratingCount,
  reviews,
  onReviewSubmitted,
}: ReviewsSectionProps) {
  const handleReviewSubmitted = () => {
    onReviewSubmitted?.();
  };

  const shouldShowSection = userId || reviews.length > 0;

  return (
    <>
      {shouldShowSection && (
        <div className="mt-12 border-t border-gray-200 pt-8">
          <SectionHeader title="Customer Reviews" />

          {/* Rating Summary - only show if reviews exist */}
          {ratingCount > 0 && (
            <Card className="mb-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">{ratingAvg.toFixed(1)}</div>
                <ProductRating rating={ratingAvg} className="justify-center mt-2" />
                <div className="text-sm text-gray-500 mt-2">
                  Based on {ratingCount} review{ratingCount !== 1 ? 's' : ''}
                </div>
              </div>
            </Card>
          )}

          {/* Review Form - only for logged-in users */}
          {userId && (
            <div className="mb-8">
              <ReviewForm
                productId={productId}
                userId={userId}
                onReviewSubmitted={handleReviewSubmitted}
              />
            </div>
          )}

          {/* Reviews List - shows existing reviews or empty state */}
          <ReviewList reviews={reviews} />
        </div>
      )}
    </>
  );
}
