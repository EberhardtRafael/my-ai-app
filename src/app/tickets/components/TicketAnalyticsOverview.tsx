import InfoMessage from '@/components/ui/InfoMessage';
import StatCard from '@/components/ui/StatCard';
import type { TicketStats } from '../types';

type AnalyticsStat = {
  label: string;
  value: string | number;
  align?: 'right';
};

type DeliveryBenchmark = {
  label: string;
  value: string;
};

const formatHours = (hours: number) => `${Number(hours || 0).toFixed(1)}h`;

export default function TicketAnalyticsOverview({ ticketStats }: { ticketStats: TicketStats | null }) {
  const analyticsStats: AnalyticsStat[] = ticketStats
    ? [
        {
          label: 'Tickets Generated',
          value: ticketStats.tickets_generated,
        },
        {
          label: 'GitHub Commits (Overall)',
          value: ticketStats.github_commits_overall,
          align: 'right',
        },
        {
          label: 'Avg Commits / Ticket',
          value: ticketStats.avg_commits_per_ticket.toFixed(2),
        },
        {
          label: 'Forecast Next Ticket',
          value: formatHours(ticketStats.forecast_hours_next_ticket),
          align: 'right',
        },
      ]
    : [];

  const deliveryBenchmarks: DeliveryBenchmark[] = ticketStats
    ? [
        {
          label: 'Median merge time',
          value: formatHours(ticketStats.median_actual_merge_time_hours),
        },
        {
          label: 'P90 merge time',
          value: formatHours(ticketStats.p90_actual_merge_time_hours),
        },
        {
          label: 'Avg estimated ticket',
          value: formatHours(ticketStats.avg_estimated_hours_per_ticket),
        },
        {
          label: 'Ticket velocity',
          value: `${ticketStats.ticket_velocity_per_week.toFixed(2)}/week`,
        },
      ]
    : [];

  return (
    <div>
      {ticketStats ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {analyticsStats.map((stat) => (
              <StatCard key={stat.label} label={stat.label} value={stat.value} align={stat.align} />
            ))}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Delivery Benchmarks</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {deliveryBenchmarks.map((benchmark) => (
                <p key={benchmark.label}>
                  {benchmark.label}: <span className="font-semibold">{benchmark.value}</span>
                </p>
              ))}
            </div>
          </div>
        </>
      ) : (
        <InfoMessage
          message="Load insights for a repository to see ticket history and delivery statistics."
          variant="muted"
          className="mb-6"
        />
      )}
    </div>
  );
}