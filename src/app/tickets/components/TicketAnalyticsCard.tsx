import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import TicketAnalyticsOverview from './TicketAnalyticsOverview';
import TicketHistoryTable from './TicketHistoryTable';
import type { TicketHistoryEntry, TicketStats } from '../types';

type TicketAnalyticsCardProps = {
  ticketStats: TicketStats | null;
  ticketHistory: TicketHistoryEntry[];
};

export default function TicketAnalyticsCard({ ticketStats, ticketHistory }: TicketAnalyticsCardProps) {
  return (
    <Card className="p-6">
      <SectionHeader title="Ticket Analytics" className="mb-4" />
      <TicketAnalyticsOverview ticketStats={ticketStats} />
      <TicketHistoryTable ticketHistory={ticketHistory} />
    </Card>
  );
}