"use client";

import React, { useState } from "react";
import { fetchProducts, Product } from "@/utils/fetchProducts";
import ProductCard from "@/components/ProductCard";
import Button from "@/components/Button";

type ProductListProps = {
  initialProducts: Product[];
};

export default function ProductList({ initialProducts }: ProductListProps) {
  const noProductsText = "No products found.";
  const loadingText = "Loading products...";

  const [category, setCategory] = useState<string>("All");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState<boolean>(false);

  const categories: string[] = ["All", "Clothing", "Footwear", "Accessories"];
  const sizes: string[] = ["S", "M", "L", "XL"];

  async function fetchProductsByCategory(selectedCategory: string): Promise<void> {
    setLoading(true);
    try {
      const data = await fetchProducts(selectedCategory);
      setProducts(data?.data?.productByCategory || []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
    setLoading(false);
  }

  // Only fetch when category changes and it's not "All"
  React.useEffect(() => {
    if (category === "All") {
      setProducts(initialProducts);
    } else {
      fetchProductsByCategory(category);
    }
  }, [category]);

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
            {cat}
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
          {products.length === 0 && <p>{noProductsText}</p>}
        </div>
      )} 
    </>      
  );
}
