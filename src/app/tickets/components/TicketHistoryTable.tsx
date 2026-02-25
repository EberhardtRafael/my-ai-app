import type React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableEmptyState,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableWrapper,
} from '@/components/ui/Table';
import type { TicketHistoryEntry } from '../types';

const formatHours = (hours: number) => `${Number(hours || 0).toFixed(1)}h`;

const formatTimestamp = (value: string) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
};

type TicketHistoryColumn = {
  key: string;
  label: string;
  renderCell: (entry: TicketHistoryEntry) => React.ReactNode;
};

const columns: TicketHistoryColumn[] = [
  {
    key: 'ticket',
    label: 'Ticket',
    renderCell: (entry) => (
      <>
        <p className="font-medium text-gray-900">{entry.ticket_id}</p>
        <p className="text-gray-600">{entry.title}</p>
      </>
    ),
  },
  {
    key: 'estimated-time',
    label: 'Estimated Time',
    renderCell: (entry) => (
      <>
        <p>{formatHours(entry.estimated_hours)}</p>
        <p className="text-xs text-gray-500">
          Range: {formatHours(entry.estimate_low)} - {formatHours(entry.estimate_high)}
        </p>
      </>
    ),
  },
  {
    key: 'commits-per-ticket',
    label: 'Commits / Ticket',
    renderCell: (entry) => Number(entry.predicted_commits || 0).toFixed(2),
  },
  {
    key: 'created-at',
    label: 'Created At',
    renderCell: (entry) => formatTimestamp(entry.created_at),
  },
];

export default function TicketHistoryTable({
  ticketHistory,
}: {
  ticketHistory: TicketHistoryEntry[];
}) {
  return (
    <TableWrapper>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableHeaderCell key={column.key}>{column.label}</TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {ticketHistory.length === 0 && (
            <TableEmptyState
              message="No ticket history yet. Generate your first ticket to start tracking progress."
              colSpan={columns.length}
            />
          )}
          {ticketHistory.length > 0 &&
            ticketHistory.map((entry) => (
              <TableRow key={entry.id} className="border-t border-gray-100">
                {columns.map((column) => (
                  <TableCell key={`${entry.id}-${column.key}`}>
                    {column.renderCell(entry)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableWrapper>
  );
}
