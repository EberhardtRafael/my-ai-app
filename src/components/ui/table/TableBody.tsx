import type { TableElementProps } from './types';

export default function TableBody({
  children,
  className = '',
  ...props
}: TableElementProps<'tbody'>) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}
