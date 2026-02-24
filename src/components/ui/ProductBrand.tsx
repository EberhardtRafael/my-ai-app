type ProductBrandProps = {
  brand?: string;
  className?: string;
};

export default function ProductBrand({ brand, className = '' }: ProductBrandProps) {
  if (!brand) return null;
  
  return (
    <p className={`text-xs text-gray-400 uppercase tracking-wide ${className}`}>
      {brand}
    </p>
  );
}
