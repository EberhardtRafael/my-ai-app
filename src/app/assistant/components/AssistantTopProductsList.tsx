import type { AssistantProduct } from '../types';

type AssistantTopProductsListProps = {
  products: AssistantProduct[];
};

export default function AssistantTopProductsList({ products }: AssistantTopProductsListProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div>
      <p className="mb-2 font-semibold">Top products</p>
      <ul className="space-y-2">
        {products.slice(0, 5).map((product) => (
          <li key={product.id} className="rounded-lg border border-gray-200 p-2">
            <p className="font-medium">{product.name}</p>
            <p className="text-xs text-gray-600">
              {product.category} · ${product.price.toFixed(2)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
