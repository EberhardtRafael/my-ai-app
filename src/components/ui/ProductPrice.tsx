type ProductPriceProps = {
  price?: number | string;
  className?: string;
};

export default function ProductPrice({ price, className = '' }: ProductPriceProps) {
  if (price === undefined) return null;

  return <p className={`font-bold ${className}`}>${price}</p>;
}
