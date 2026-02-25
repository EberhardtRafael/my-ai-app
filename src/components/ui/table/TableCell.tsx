import type { TableElementProps } from './types';

export default function TableCell({ children, className = '', ...props }: TableElementProps<'td'>) {
  return (
    <td className={`px-3 py-2 ${className}`} {...props}>
      {children}
    </td>
  );
}
