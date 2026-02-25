import TableCell from './TableCell';
import TableRow from './TableRow';

type TableEmptyStateProps = {
  message: string;
  colSpan: number;
  cellClassName?: string;
  rowClassName?: string;
};

export default function TableEmptyState({
  message,
  colSpan,
  cellClassName = 'py-4 text-gray-500',
  rowClassName = '',
}: TableEmptyStateProps) {
  return (
    <TableRow className={rowClassName}>
      <TableCell className={cellClassName} colSpan={colSpan}>
        {message}
      </TableCell>
    </TableRow>
  );
}
