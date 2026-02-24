'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ActionSection from '@/components/ui/ActionSection';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConnectionCard from '@/components/ui/ConnectionCard';
import InfoMessage from '@/components/ui/InfoMessage';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import SectionHeader from '@/components/ui/SectionHeader';
import Select from '@/components/ui/Select';
import StatCard from '@/components/ui/StatCard';
import StatusMessage from '@/components/ui/StatusMessage';
import TaskCard from '@/components/ui/TaskCard';
import Textarea from '@/components/ui/Textarea';
import TicketEmptyState from '@/components/ui/TicketEmptyState';
import { TICKET_CONTEXT_OPTIONS } from '@/constants/ticketOptions';
import { CheckCircleIcon, DocumentIcon, GithubIcon } from '@/icons/TicketIcons';

interface GeneratedTicket {
  id: string;
  title: string;
  markdown: string;
  estimation: {
    hours: number;
    range: [number, number];
    confidence: number;
  };
  similar_tasks?: Array<{
    title: string;
    actual_hours: number;
    similarity: number;
  }>;
}

const TicketsPage = () => {
  const searchParams = useSearchParams();
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [context, setContext] = useState<string>('full-stack');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedTicket, setGeneratedTicket] = useState<GeneratedTicket | null>(null);
  const [error, setError] = useState<string>('');

  // Check for OAuth callback
  useEffect(() => {
    const connected = searchParams.get('connected');
    const errorParam = searchParams.get('error');

    if (connected === 'true') {
      // Check for github_username cookie
      const cookies = document.cookie.split(';');
      const usernameCookie = cookies.find((c) => c.trim().startsWith('github_username='));
      if (usernameCookie) {
        const username = usernameCookie.split('=')[1];
        setGithubUsername(username);
        setIsConnected(true);
      }
    }

    if (errorParam) {
      setError(`Authentication failed: ${errorParam}`);
    }
  }, [searchParams]);

  const handleConnectGithub = () => {
    // OAuth flow will be implemented
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/github/callback`;
    const scope = 'public_repo,read:user';

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  };

  const handleGenerateTicket = async () => {
    setError('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/tickets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: repoUrl,
          task_description: taskDescription,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate ticket');
      }

      const data = await response.json();
      setGeneratedTicket(data.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!generatedTicket) return;

    const blob = new Blob([generatedTicket.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedTicket.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    if (!generatedTicket) return;
    navigator.clipboard.writeText(generatedTicket.markdown);
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <PageHeader
        title="AI Ticket Generator"
        description="Generate comprehensive tickets with ML-powered estimations based on your GitHub history"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input Form */}
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
                      onClick={handleConnectGithub}
                      className="w-full bg-gray-900 text-white hover:bg-gray-700"
                    >
                      <GithubIcon className="w-5 h-5 mr-2" />
                      Connect GitHub
                    </Button>
                  ),
                },
                connected: {
                  content: (
                    <StatusMessage
                      icon={<CheckCircleIcon className="w-5 h-5" />}
                      message={`Connected as ${githubUsername}`}
                      variant="success"
                    />
                  ),
                  actions: (
                    <Button
                      onClick={() => setIsConnected(false)}
                      variant="secondary"
                      className="w-full"
                    >
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
                  onChange={(e) => setRepoUrl(e.target.value)}
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
                onChange={(e) => setTaskDescription(e.target.value)}
                disabled={!isConnected}
              />

              <Select
                id="context-select"
                label="Context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                options={TICKET_CONTEXT_OPTIONS}
                disabled={!isConnected}
              />

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerateTicket}
                disabled={!isConnected || !repoUrl || !taskDescription || isGenerating}
                className="w-full bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate Ticket'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Generated Ticket */}
        <div className="space-y-6">
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
                actions={
                  <>
                    <Button
                      onClick={handleCopyToClipboard}
                      variant="secondary"
                      className="text-sm py-1 px-3"
                    >
                      Copy
                    </Button>
                    <Button
                      onClick={handleDownloadMarkdown}
                      variant="secondary"
                      className="text-sm py-1 px-3"
                    >
                      Download MD
                    </Button>
                  </>
                }
                className="mb-4"
              />

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <StatCard
                    label="Estimated Time"
                    value={`${generatedTicket.estimation.hours}h`}
                    subtitle={`Range: ${generatedTicket.estimation.range[0]}-${generatedTicket.estimation.range[1]}h`}
                  />
                  <StatCard
                    label="Confidence"
                    value={`${Math.round(generatedTicket.estimation.confidence * 100)}%`}
                    align="right"
                  />
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
                icon={<DocumentIcon className="w-16 h-16" />}
                message="Connect GitHub and generate a ticket to see it here"
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketsPage;
