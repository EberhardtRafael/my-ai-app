import type { TableElementProps } from './types';

export default function Table({ children, className = '', ...props }: TableElementProps<'table'>) {
  return (
    <table className={`min-w-full text-sm ${className}`} {...props}>
      {children}
    </table>
  );
}
