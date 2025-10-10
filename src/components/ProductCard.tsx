
import React from "react";

type ProductCardProps = {
  id?: number | string;
  name?: string;
  category?: string;
  price?: number | string;
  className?: string;
};

const ProductCard: React.FC<ProductCardProps> = ({name, category, price, className = ""}) => (
    <div className={`bg-white p-4 rounded-md shadow hover:shadow-lg transition ${className}`}>
        <div className="bg-gray-200 h-40 mb-4 rounded-md flex items-center justify-center text-gray-500">
            Image
        </div>
        <h2 className="font-semibold">{name}</h2>
        <p className="text-gray-500">{category}</p>
        <p className="font-bold mt-2">${price}</p>
    </div>
)

export default ProductCard;