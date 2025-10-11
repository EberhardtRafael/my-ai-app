import ProductList from "./productList";
import { fetchProducts } from "@/utils/fetchProducts";

export type FilterParams = { [key: string]: string | undefined };

type ProductPageProps = {
  searchParams?: FilterParams;
};

export default async function ProductPage({ searchParams }: ProductPageProps) {
  const plpTitleText = "Products";
  // Await searchParams if it's a Promise (Next.js 14+)
  const params = searchParams && typeof searchParams.then === "function"
    ? await searchParams
    : searchParams || {};
  const category = typeof params.category === "string" ? params.category : null;
  const color = typeof params.color === "string" ? params.color : null;
  const data = await fetchProducts(category, color, 0, 12, true);
  const products = data?.data?.products || [];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">{plpTitleText}</h1>
      <ProductList initialProducts={products} initialFilters={params as FilterParams} />
    </main>
  );
}