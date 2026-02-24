export type Favorite = {
  id: number;
  user_id: number;
  product_id: number;
  created_at: string;
  removed_at?: string | null;
  product: {
    id: number;
    name: string;
    category: string;
    price: number;
    variants?: Array<{
      id: number;
      sku: string;
      color: string;
      size: string;
      stock: number;
    }>;
  };
};

type FetchFavoritesResponse = {
  data?: {
    favorites?: Favorite[];
  };
  [key: string]: any;
};

export async function fetchFavorites(
  userId: number,
  isServer: boolean = false
): Promise<FetchFavoritesResponse> {
  const url = isServer ? `${process.env.NEXTAUTH_URL}/api/favorites` : '/api/favorites';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{ favorites(userId: ${userId}, activeOnly: true) { id userId productId createdAt removedAt product { id name category price variants { id sku color size stock } } } }`,
    }),
    cache: isServer ? 'no-store' : undefined,
  });

  const data = await res.json();
  return data;
}
