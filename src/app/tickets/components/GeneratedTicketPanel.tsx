import ActionSection from '@/components/ui/ActionSection';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';
import StatCard from '@/components/ui/StatCard';
import TaskCard from '@/components/ui/TaskCard';
import TicketEmptyState from '@/components/ui/TicketEmptyState';
import type { GeneratedTicket } from '../types';

type GeneratedTicketPanelProps = {
  generatedTicket: GeneratedTicket | null;
  onCopyToClipboard: () => void;
  onDownloadMarkdown: () => void;
};

export default function GeneratedTicketPanel({
  generatedTicket,
  onCopyToClipboard,
  onDownloadMarkdown,
}: GeneratedTicketPanelProps) {
  const actionButtons = [
    {
      key: 'copy',
      label: 'Copy',
      onClick: onCopyToClipboard,
    },
    {
      key: 'download-markdown',
      label: 'Download MD',
      onClick: onDownloadMarkdown,
    },
  ];

  const ticketStatCards = generatedTicket
    ? [
        {
          key: 'estimated-time',
          label: 'Estimated Time',
          value: `${generatedTicket.estimation.hours}h`,
          subtitle: `Range: ${generatedTicket.estimation.range[0]}-${generatedTicket.estimation.range[1]}h`,
        },
        {
          key: 'confidence',
          label: 'Confidence',
          value: `${Math.round(generatedTicket.estimation.confidence * 100)}%`,
          align: 'right' as const,
        },
      ]
    : [];

  return (
    <div>
      {generatedTicket ? (
        <Card className="p-6">
          <ActionSection
            layout="horizontal"
            content={
              <div>
                <h2 className="text-2xl font-semibold">{generatedTicket.title}</h2>
                <p className="text-sm text-gray-500">{generatedTicket.id}</p>
              </div>
            }
            actions={actionButtons.map((button) => (
              <Button
                key={button.key}
                onClick={button.onClick}
                variant="secondary"
                className="text-sm py-1 px-3"
              >
                {button.label}
              </Button>
            ))}
            className="mb-4"
          />

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              {ticketStatCards.map((stat) => (
                <StatCard
                  key={stat.key}
                  label={stat.label}
                  value={stat.value}
                  subtitle={stat.subtitle}
                  align={stat.align}
                />
              ))}
            </div>
          </div>

          {generatedTicket.similar_tasks && generatedTicket.similar_tasks.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Similar Historical Tasks</h3>
              <div className="space-y-2">
                {generatedTicket.similar_tasks.map((task) => (
                  <TaskCard
                    key={task.title}
                    title={task.title}
                    actualHours={task.actual_hours}
                    similarity={task.similarity}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-[600px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {generatedTicket.markdown}
              </pre>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <TicketEmptyState
            icon={<Icon name="document" size={64} />}
            message="Connect GitHub and generate a ticket to see it here"
          />
        </Card>
      )}
    </div>
  );
}
