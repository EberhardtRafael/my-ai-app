/**
 * Fetch personalized product recommendations for a user
 * Uses collaborative filtering based on browsing/purchase history
 * Falls back to trending products for new users
 */

export interface RecommendedProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  variants: {
    id: number;
    sku: string;
    color: string;
    size: string;
    stock: number;
  }[];
}

export async function fetchRecommendations(
  userId: number,
  limit: number = 8
): Promise<RecommendedProduct[]> {
  try {
    const query = `
      query GetPersonalizedRecommendations($userId: Int!, $limit: Int!) {
        personalizedRecommendations(userId: $userId, limit: $limit) {
          id
          name
          category
          price
          variants {
            id
            sku
            color
            size
            stock
          }
        }
      }
    `;

    const variables = {
      userId,
      limit,
    };

    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    console.log('Recommendations API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API returned error:', response.status, errorText);
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Recommendations API result:', result);

    if (result.error) {
      console.error('Error fetching recommendations:', result.error);
      throw new Error('Failed to fetch recommendations');
    }

    return result.data?.personalizedRecommendations || [];
  } catch (error) {
    console.error('Error in fetchRecommendations:', error);
    return [];
  }
}
