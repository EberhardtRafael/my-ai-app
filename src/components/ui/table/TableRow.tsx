import type { TableElementProps } from './types';

export default function TableRow({ children, className = '', ...props }: TableElementProps<'tr'>) {
  return (
    <tr className={className} {...props}>
      {children}
    </tr>
  );
}
