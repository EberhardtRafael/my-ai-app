import type { Product } from './fetchProducts';

/**
 * Fetch trending products (most added to cart or purchased in last 24-48 hours)
 * Aggregates data from all users' carts and completed orders
 * @param hours - Time window in hours (default: 48)
 * @param limit - Maximum number of products to return (default: 10)
 * @returns Array of trending products
 */
export async function fetchTrending(hours: number = 48, limit: number = 10): Promise<Product[]> {
  const query = `
    query Trending($hours: Int!, $limit: Int!) {
      trending(hours: $hours, limit: $limit) {
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

  const response = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: { hours, limit },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch trending products: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return result.data.trending || [];
}
