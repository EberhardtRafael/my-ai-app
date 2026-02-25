import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConnectionCard from '@/components/ui/ConnectionCard';
import Icon from '@/components/ui/Icon';
import InfoMessage from '@/components/ui/InfoMessage';
import Input from '@/components/ui/Input';
import SectionHeader from '@/components/ui/SectionHeader';
import Select from '@/components/ui/Select';
import StatusMessage from '@/components/ui/StatusMessage';
import Textarea from '@/components/ui/Textarea';
import { TICKET_CONTEXT_OPTIONS } from '@/constants/ticketOptions';

type TicketSetupPanelProps = {
  isConnected: boolean;
  githubUsername: string;
  repoUrl: string;
  taskDescription: string;
  context: string;
  error: string;
  isGenerating: boolean;
  isLoadingInsights: boolean;
  onConnectGithub: () => void;
  onDisconnectGithub: () => void;
  onRepoChange: (value: string) => void;
  onTaskDescriptionChange: (value: string) => void;
  onContextChange: (value: string) => void;
  onGenerateTicket: () => void;
  onLoadInsights: () => void;
};

export default function TicketSetupPanel({
  isConnected,
  githubUsername,
  repoUrl,
  taskDescription,
  context,
  error,
  isGenerating,
  isLoadingInsights,
  onConnectGithub,
  onDisconnectGithub,
  onRepoChange,
  onTaskDescriptionChange,
  onContextChange,
  onGenerateTicket,
  onLoadInsights,
}: TicketSetupPanelProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionHeader title="GitHub Connection" className="mb-4" />

        <ConnectionCard
          isConnected={isConnected}
          states={{
            disconnected: {
              content: (
                <InfoMessage
                  message="Connect your GitHub account to analyze repository history and generate accurate estimations."
                  variant="default"
                />
              ),
              actions: (
                <Button
                  onClick={onConnectGithub}
                  className="w-full bg-gray-900 text-white hover:bg-gray-700"
                >
                  <Icon name="github" size={20} className="mr-2" />
                  Connect GitHub
                </Button>
              ),
            },
            connected: {
              content: (
                <StatusMessage
                  icon={<Icon name="check-circle" size={20} />}
                  message={`Connected as ${githubUsername}`}
                  variant="success"
                />
              ),
              actions: (
                <Button onClick={onDisconnectGithub} variant="secondary" className="w-full">
                  Disconnect
                </Button>
              ),
            },
          }}
        />
      </Card>

      <Card className="p-6">
        <SectionHeader title="Generate Ticket" className="mb-4" />

        <div className="space-y-4">
          <div>
            <Input
              id="repo-input"
              label="Repository"
              placeholder="username/repo or github.com/username/repo"
              value={repoUrl}
              onChange={(event) => onRepoChange(event.target.value)}
              disabled={!isConnected}
            />
            <InfoMessage
              message="Example: sarate/my-ai-app"
              variant="muted"
              className="text-xs mt-1"
            />
          </div>

          <Textarea
            id="task-description"
            label="Task Description"
            className="min-h-[150px]"
            placeholder="Describe what you want to build...&#10;&#10;Example: Add dark mode toggle to the header with system preference detection and localStorage persistence. Should work across all pages with smooth transitions."
            value={taskDescription}
            onChange={(event) => onTaskDescriptionChange(event.target.value)}
            disabled={!isConnected}
          />

          <Select
            id="context-select"
            label="Context"
            value={context}
            onChange={(event) => onContextChange(event.target.value)}
            options={TICKET_CONTEXT_OPTIONS}
            disabled={!isConnected}
          />

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            onClick={onGenerateTicket}
            disabled={!isConnected || !repoUrl || !taskDescription || isGenerating}
            className="w-full bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Ticket'}
          </Button>

          <Button
            onClick={onLoadInsights}
            disabled={!isConnected || !repoUrl || isLoadingInsights}
            variant="secondary"
            className="w-full"
          >
            {isLoadingInsights ? 'Loading Insights...' : 'Load Ticket Insights'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
