"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchProducts, Product } from "@/utils/fetchProducts";
import ProductCard from "@/components/ProductCard";
import Button from "@/components/Button";
import { FilterParams } from "./page";
import { PLP_PAGINATION_LIMIT } from "@/utils/constans";

type ProductListProps = {
  initialProducts: Product[];
  initialFilters?: FilterParams;
};

export default function ProductList({ initialProducts, initialFilters }: ProductListProps) {
  const noProductsText = "No products found.";
  const loadingText = "Loading products...";

  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<string | null>(initialFilters?.category || null);
  const [color, setColor] = useState<string | null>(initialFilters?.color || null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState<boolean>(false);

  const offsetRef = useRef(initialProducts.length);
  const sentinelRef = useRef<HTMLDivElement>(null);

  //Where do I take the info about all possible categories, sizes and colors in real life?
  const categories: (string | null)[] = [null, "Clothing", "Footwear", "Accessories", "Tools", "Equipment"];
  const colors: (string | null)[] = [null, "Red", "Blue", "Black", "White", "Green"];
  const sizes: string[] = ["S", "M", "L", "XL"];

  async function filterProducts(search: string | undefined = initialFilters?.search, selectedCategory: string | null, selectedColor: string | null): Promise<void> {
    setLoading(true);
    try {
      const data = await fetchProducts(search, selectedCategory, selectedColor);
      const fetchedProducts = data?.data?.products || [];
      offsetRef.current = fetchedProducts.length;
      setProducts(fetchedProducts);
    } catch (err) {
      console.error(err);
      setProducts([]);
    }
    setLoading(false);
  }

  const loadMore = async () => {
    const data = await fetchProducts(initialFilters?.search, category, color, offsetRef.current, PLP_PAGINATION_LIMIT);
    const fetchedProducts = data?.data?.products || [];
    offsetRef.current += fetchedProducts.length;
    setProducts(prev => [...prev, ...fetchedProducts]);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (products.length && entry.isIntersecting) {
        loadMore();
      }
    });
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => observer.disconnect();
  }, [products]);

  const handleUrlOnFiltering = (category: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    router.push(`/plp?${params.toString()}`);
  }

  useEffect(() => {
    const search = searchParams.get("search") || "";
    filterProducts(search, category, color);
  }, [searchParams.get("search")]);

  useEffect(() => {
    const search = searchParams.get("search") || "";
    if (!search && !category && !color) {
      setProducts(initialProducts);
    } else {      
      filterProducts(search, category, color);
    }
    handleUrlOnFiltering(category)
  }, [category, color]);

  return (    
    <>
      <div className="flex flex-col sm:flex-row mb-6 divide-x divide-gray-200">
        {categories.map((cat, index) => (
          <Button 
            key={cat}
            onClick={() => setCategory(cat)}
            className={`
              ${category === cat
                ? "font-semibold bg-gray-300 text-black hover:bg-gray-300 hover:text-black"
                : "bg-gray-300 text-gray-700 hover:bg-gray-200 hover:text-gray-900 hover:font-medium"
              }
              ${(index !== 0 && index !== categories.length - 1)  && "sm:rounded-none"}
              ${index === 0  && "sm:rounded-r-none"}
              ${index === categories.length - 1  && "sm:rounded-l-none"}
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
