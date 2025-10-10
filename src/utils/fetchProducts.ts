export type Product = {
  id?: number;
  name?: string;
  category?: string;
  price?: number;
  [key: string]: any; // allows arbitrary new props
};

type FetchProductsResponse = {
  data?: {
    productByCategory?: Product[];
  };
  [key: string]: any;
};

export async function fetchProducts(category: string = '', isServer : boolean = false): Promise<FetchProductsResponse> {
  const url = isServer
    ? "http://localhost:3001/api/get-products"
    : "/api/get-products";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `{ productByCategory(category: "${category}") { id name category price } }`,
    }),
    cache: isServer ? "no-store" : undefined,
  });
  const data = await res.json();
  return data;
}