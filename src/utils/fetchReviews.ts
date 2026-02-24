export type Review = {
  id: number;
  productId: number;
  userId: number;
  username: string;
  rating: number;
  title?: string;
  comment?: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function fetchReviews(productId: number, limit: number = 20, offset: number = 0): Promise<Review[]> {
  const query = `
    query GetReviews($productId: Int!, $limit: Int!, $offset: Int!) {
      reviews(productId: $productId, limit: $limit, offset: $offset) {
        id
        productId
        userId
        username
        rating
        title
        comment
        verifiedPurchase
        helpfulCount
        createdAt
        updatedAt
      }
    }
  `;

  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { productId, limit, offset },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Failed to fetch reviews');
  }

  return result.data.reviews || [];
}

export async function submitReview(
  productId: number,
  userId: number,
  rating: number,
  title?: string,
  comment?: string
): Promise<Review> {
  const mutation = `
    mutation SubmitReview($productId: Int!, $userId: Int!, $rating: Int!, $title: String, $comment: String) {
      submitReview(productId: $productId, userId: $userId, rating: $rating, title: $title, comment: $comment) {
        id
        productId
        userId
        username
        rating
        title
        comment
        verifiedPurchase
        helpfulCount
        createdAt
        updatedAt
      }
    }
  `;

  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: mutation,
      variables: { productId, userId, rating, title, comment },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit review: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Failed to submit review');
  }

  return result.data.submitReview;
}

export async function markReviewHelpful(reviewId: number): Promise<Review> {
  const mutation = `
    mutation MarkReviewHelpful($reviewId: Int!) {
      markReviewHelpful(reviewId: $reviewId) {
        id
        helpfulCount
      }
    }
  `;

  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: mutation,
      variables: { reviewId },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark review as helpful: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0]?.message || 'Failed to mark review as helpful');
  }

  return result.data.markReviewHelpful;
}
