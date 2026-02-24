type ProductTitleProps = {
  name?: string;
  category?: string;
  className?: string;
};

export default function ProductTitle({ name, category, className = '' }: ProductTitleProps) {
  return (
    <div className={className}>
      <h2 className="font-semibold">{name}</h2>
      {category && <p className="text-gray-500 text-sm">{category}</p>}
    </div>
  );
}
