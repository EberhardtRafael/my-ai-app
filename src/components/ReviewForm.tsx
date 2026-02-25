'use client';

import { useState } from 'react';
import { useLocalization } from '@/contexts/LocalizationContext';
import { submitReview } from '@/utils/fetchReviews';
import Button from './ui/Button';
import Card from './ui/Card';
import ErrorMessage from './ui/ErrorMessage';
import Input from './ui/Input';
import StarRatingSelector from './ui/StarRatingSelector';
import Textarea from './ui/Textarea';

type ReviewFormProps = {
  productId: number;
  userId: number;
  onReviewSubmitted: () => void;
};

export default function ReviewForm({ productId, userId, onReviewSubmitted }: ReviewFormProps) {
  const { t } = useLocalization();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      setError(t('reviews.selectRatingError'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitReview(productId, userId, rating, title, comment);
      // Reset form
      setRating(5);
      setTitle('');
      setComment('');
      // Notify parent to reload reviews
      onReviewSubmitted();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err instanceof Error ? err.message : t('reviews.submitError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card header={<h3 className="text-lg font-semibold">{t('reviews.writeReview')}</h3>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">{t('reviews.yourRating')}</span>
          <StarRatingSelector value={rating} onChange={setRating} />
        </div>

        {/* Title */}
        <Input
          id="review-title"
          label={t('reviews.reviewTitle')}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('reviews.reviewTitlePlaceholder')}
        />

        {/* Comment */}
        <Textarea
          id="review-comment"
          label={t('reviews.yourReview')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('reviews.yourReviewPlaceholder')}
          rows={4}
        />

        {error && <ErrorMessage message={error} />}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('reviews.submitting') : t('reviews.submitReview')}
        </Button>
      </form>
    </Card>
  );
}
