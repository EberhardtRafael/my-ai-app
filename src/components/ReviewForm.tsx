'use client';

import { useState } from 'react';
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
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating < 1 || rating > 5) {
      setError('Please select a rating');
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
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      header={<h3 className="text-lg font-semibold">Write a Review</h3>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Rating *
          </label>
          <StarRatingSelector value={rating} onChange={setRating} />
        </div>

        {/* Title */}
        <Input
          id="review-title"
          label="Review Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience"
        />

        {/* Comment */}
        <Textarea
          id="review-comment"
          label="Your Review"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us more about your experience..."
          rows={4}
        />

        {error && <ErrorMessage message={error} />}

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </Card>
  );
}
