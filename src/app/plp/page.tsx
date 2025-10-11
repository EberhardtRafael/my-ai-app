import ProductList from "./productList";
import { fetchProducts } from "@/utils/fetchProducts";


export default async function ProductPage() {
  const plpTitleText = "Products";
  const data = await fetchProducts(null, null, 0, 12, true);
  const products = data?.data?.products || [];

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">{plpTitleText}</h1>
      <ProductList initialProducts={products} />
    </main>
  );
}