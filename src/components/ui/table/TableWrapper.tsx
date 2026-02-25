import type { TableWrapperProps } from './types';

export default function TableWrapper({ children, className = '' }: TableWrapperProps) {
  return <div className={`overflow-x-auto border border-gray-200 rounded-lg ${className}`}>{children}</div>;
}
