export type Product = {
  id?: number;
  name?: string;
  category?: string;
  price?: number;
  [key: string]: any; // allows arbitrary new props
};

type FetchProductsResponse = {
  data?: {
    products?: Product[];
  };
  [key: string]: any;
};

const toGraphQlArg = (arg: string | null) => (arg ? arg : '');

export async function fetchProducts(
  searchTerm: string = '',
  category: string | null = null,
  color: string | null = null,
  offset: number = 0,
  limit: number = 12,
  isServer: boolean = false
): Promise<FetchProductsResponse> {
  const url = isServer ? `${process.env.NEXTAUTH_URL}/api/products` : '/api/products';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `{ products(searchTerm: "${searchTerm}", category: "${toGraphQlArg(category)}", color: "${toGraphQlArg(color)}", offset: ${offset}, limit: ${limit}) { id name category price variants { id sku color size stock} } }`,
    }),
    cache: isServer ? 'no-store' : undefined,
  });
  const data = await res.json();
  return data;
}
