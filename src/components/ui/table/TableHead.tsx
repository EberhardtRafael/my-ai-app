import type { TableElementProps } from './types';

export default function TableHead({
  children,
  className = '',
  ...props
}: TableElementProps<'thead'>) {
  return (
    <thead className={`bg-gray-50 ${className}`} {...props}>
      {children}
    </thead>
  );
}
