import type { TableElementProps } from './types';

export default function TableHeaderCell({
  children,
  className = '',
  ...props
}: TableElementProps<'th'>) {
  return (
    <th className={`text-left px-3 py-2 font-medium text-gray-700 ${className}`} {...props}>
      {children}
    </th>
  );
}
