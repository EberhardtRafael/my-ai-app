'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import SidePanel from '@/components/SidePanel';
import { useFavorites } from '@/contexts/FavoritesContext';
import { getProductImageUrl } from '@/utils/colorUtils';

type PDPPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default function PDPPage({ params }: PDPPageProps) {
  const [id, setId] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { favoritesCount } = useFavorites();

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = 'then' in params ? await params : params;
      setId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // Fetch product data
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      const productQuery = `{ product(id: ${id}) { id name price category variants { id sku color size stock } } }`;
      const productResponse = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: productQuery }),
      });
      const productResult = await productResponse.json();
      const fetchedProduct = productResult?.data?.product;
      setProduct(fetchedProduct);

      // Set initial color and size to first variant's values
      if (fetchedProduct?.variants?.[0]) {
        setSelectedColor(fetchedProduct.variants[0].color);
        setSelectedSize(fetchedProduct.variants[0].size);
      }
    };

    fetchProduct();
  }, [id]);

  // Check if product is favorited
  useEffect(() => {
    if (!userId || !id) return;

    const checkFavorite = async () => {
      try {
        const query = `{ favorites(userId: ${userId}, activeOnly: true) { productId } }`;
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const result = await response.json();
        const favorites = result?.data?.favorites || [];
        setIsFavorite(favorites.some((fav: any) => fav.productId === parseInt(id, 10)));
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavorite();
  }, [userId, id, favoritesCount]);

  if (!id || !product) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }

  const getSizeLabel = () => {
    if (!selectedSize) return '';
    const sizeMap: Record<string, string> = {
      S: 'Small',
      M: 'Medium',
      L: 'Large',
      XL: 'Extra Large',
    };
    return sizeMap[selectedSize] || selectedSize;
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Product Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Product Image */}
          <div className="md:col-span-2 h-96 rounded-lg overflow-hidden relative">
            <img
              src={getProductImageUrl(selectedColor || product.variants?.[0]?.color, 800, 600)}
              alt={product.name || 'Product'}
              className="w-full h-full object-cover"
            />
            {selectedSize && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded">
                <span className="text-lg font-semibold">Size: {getSizeLabel()}</span>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="md:col-span-1 h-96">
            <SidePanel
              productId={id}
              userId={userId}
              initialIsFavorite={isFavorite}
              product={product}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              onColorChange={setSelectedColor}
              onSizeChange={setSelectedSize}
              onFavoriteChange={setIsFavorite}
            />
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-500">Related products grid will appear here</p>
        </div>
      </div>
    </main>
  );
}
