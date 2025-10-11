"use client";

import React, { useEffect, useRef, useState } from "react";
import { fetchProducts, Product } from "@/utils/fetchProducts";
import ProductCard from "@/components/ProductCard";
import Button from "@/components/Button";

type ProductListProps = {
  initialProducts: Product[];
};

export default function ProductList({ initialProducts }: ProductListProps) {
  const noProductsText = "No products found.";
  const loadingText = "Loading products...";

  const [category, setCategory] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState<boolean>(false);

  const offsetRef = useRef(12);
  const sentinelRef = useRef<HTMLDivElement>(null);

  //Where do I take the info about all possible categories, sizes and colors in real life?
  const categories: (string | null)[] = [null, "Clothing", "Footwear", "Accessories", "Tools", "Equipment"];
  const colors: (string | null)[] = [null, "Red", "Blue", "Black", "White", "Green"];
  const sizes: string[] = ["S", "M", "L", "XL"];

  async function filterProducts(selectedCategory: string | null, selectedColor: string | null): Promise<void> {
    setLoading(true);
    try {
      const data = await fetchProducts(selectedCategory, selectedColor);
      offsetRef.current = 12;
      setProducts(data?.data?.products || []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
    setLoading(false);
  }

  const loadMore = async () => {
    const data = await fetchProducts(category, color, offsetRef.current, 12);
    setProducts(prev => [...prev, ...data?.data?.products || []]);
    offsetRef.current += 12;
  }

  useEffect(() => {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      loadMore();
    }
  });
  if (sentinelRef.current) {
    observer.observe(sentinelRef.current);
  }
  return () => observer.disconnect();
}, [products]);

  // Only fetch when category changes and it's not "All"
  React.useEffect(() => {
    if (!category && !color) {
      setProducts(initialProducts);
    } else {
      filterProducts(category, color);
    }
  }, [category, color]);

  return (    
    <>
      <div className="flex mb-6 divide-x divide-gray-200">
        {categories.map((cat, index) => (
          <Button 
            key={cat}
            onClick={() => setCategory(cat)}
            className={`
              ${category === cat
                ? "font-semibold bg-gray-300 text-black hover:bg-gray-300 hover:text-black"
                : "bg-gray-300 text-gray-700 hover:bg-gray-200 hover:text-gray-900 hover:font-medium"
              }
              ${(index !== 0 && index !== categories.length - 1)  && "rounded-none"}
              ${index === 0  && "rounded-r-none"}
              ${index === categories.length - 1  && "rounded-l-none"}
            `}
          >
            {cat || "All"}
          </Button> 
        ))}
      </div>
      {loading ? (
        <p>{loadingText}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} name={product.name} category={product.category} price={product.price} />
          ))}
          <div ref={sentinelRef}></div>
          {products.length === 0 && <p>{noProductsText}</p>}
        </div>
      )} 
    </>      
  );
}
