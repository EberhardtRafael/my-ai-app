'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import GeneratedTicketPanel from './components/GeneratedTicketPanel';
import TicketAnalyticsCard from './components/TicketAnalyticsCard';
import TicketSetupPanel from './components/TicketSetupPanel';
import type { GeneratedTicket, TicketHistoryEntry, TicketStats } from './types';

const normalizeRepoInput = (repo: string) =>
  repo.replace('https://github.com/', '').replace('http://github.com/', '').replace('.git', '');

const TicketsClientPage = () => {
  const searchParams = useSearchParams();
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [context, setContext] = useState<string>('full-stack');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [githubUsername, setGithubUsername] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedTicket, setGeneratedTicket] = useState<GeneratedTicket | null>(null);
  const [ticketHistory, setTicketHistory] = useState<TicketHistoryEntry[]>([]);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState<boolean>(false);
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

  const loadTicketInsights = async (repoOverride?: string) => {
    const effectiveRepo = normalizeRepoInput((repoOverride || repoUrl).trim());

    if (!effectiveRepo) {
      setError('Please enter a repository to load ticket insights');
      return;
    }

    setIsLoadingInsights(true);
    setError('');

    try {
      const [historyResponse, statsResponse] = await Promise.all([
        fetch(`/api/tickets/history?repo=${encodeURIComponent(effectiveRepo)}`),
        fetch(`/api/tickets/stats?repo=${encodeURIComponent(effectiveRepo)}`),
      ]);

      if (!historyResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch ticket analytics');
      }

      const historyData = await historyResponse.json();
      const statsData = await statsResponse.json();

      setTicketHistory(historyData.history || []);
      setTicketStats(statsData.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ticket insights');
    } finally {
      setIsLoadingInsights(false);
    }
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
      await loadTicketInsights(repoUrl);
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
        <TicketSetupPanel
          isConnected={isConnected}
          githubUsername={githubUsername}
          repoUrl={repoUrl}
          taskDescription={taskDescription}
          context={context}
          error={error}
          isGenerating={isGenerating}
          isLoadingInsights={isLoadingInsights}
          onConnectGithub={handleConnectGithub}
          onDisconnectGithub={() => setIsConnected(false)}
          onRepoChange={setRepoUrl}
          onTaskDescriptionChange={setTaskDescription}
          onContextChange={setContext}
          onGenerateTicket={handleGenerateTicket}
          onLoadInsights={() => loadTicketInsights()}
        />

        <div className="space-y-6">
          <GeneratedTicketPanel
            generatedTicket={generatedTicket}
            onCopyToClipboard={handleCopyToClipboard}
            onDownloadMarkdown={handleDownloadMarkdown}
          />
          <TicketAnalyticsCard ticketStats={ticketStats} ticketHistory={ticketHistory} />
        </div>
      </div>
    </div>
  );
};

export default TicketsClientPage;
