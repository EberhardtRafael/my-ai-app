type StatCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  align?: 'left' | 'right';
  className?: string;
};

export default function StatCard({
  label,
  value,
  subtitle,
  align = 'left',
  className = '',
}: StatCardProps) {
  const alignClass = align === 'right' ? 'text-right' : '';

  return (
    <div className={`${alignClass} ${className}`}>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}
