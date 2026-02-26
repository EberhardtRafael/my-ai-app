import Card from '@/components/ui/Card';
import SectionHeader from '@/components/ui/SectionHeader';
import type { RepoStatsSnapshot, TicketHistoryEntry, TicketStats } from '../types';
import TicketAnalyticsOverview from './TicketAnalyticsOverview';
import TicketHistoryTable from './TicketHistoryTable';

type TicketAnalyticsCardProps = {
  ticketStats: TicketStats | null;
  ticketHistory: TicketHistoryEntry[];
  repoStatsSnapshot?: RepoStatsSnapshot | null;
};

export default function TicketAnalyticsCard({
  ticketStats,
  ticketHistory,
  repoStatsSnapshot,
}: TicketAnalyticsCardProps) {
  return (
    <Card className="p-6">
      <SectionHeader
        title="Ticket Analytics"
        subtitle="Includes repository metrics plus a history of previously generated tickets."
        className="mb-4"
      />
      <TicketAnalyticsOverview ticketStats={ticketStats} repoStatsSnapshot={repoStatsSnapshot} />
      <TicketHistoryTable ticketHistory={ticketHistory} />
    </Card>
  );
}
