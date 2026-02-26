'use client';

import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ErrorMessage from '@/components/ui/ErrorMessage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';

type CommandConfig = {
  id: string;
  label: string;
  description: string;
};

type TestSummary = {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  durationSeconds: number | null;
};

type CoverageMetric = {
  label: string;
  covered: number;
  total: number;
  percent: number;
};

type CoverageSummary = {
  statements: CoverageMetric | null;
  branches: CoverageMetric | null;
  functions: CoverageMetric | null;
  lines: CoverageMetric | null;
};

type TestRunResult = {
  commandId: string;
  commandLabel: string;
  success: boolean;
  exitCode: number;
  durationMs: number;
  summary: TestSummary;
  coverage: CoverageSummary | null;
  output: string;
  finishedAt: string;
};

const toPercent = (value: number): string => `${Math.max(0, Math.min(100, value)).toFixed(2)}%`;

function MetricBar({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-700">
        <span>{label}</span>
        <span className="font-semibold">{toPercent(safeValue)}</span>
      </div>
      <div className="h-3 rounded bg-gray-200 overflow-hidden">
        <div className="h-full bg-gray-800" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function SummaryMetrics({ summary }: { summary: TestSummary | null }) {
  if (!summary) {
    return (
      <Card>
        <p className="text-gray-600">Run one of the test commands to see pass/fail analytics.</p>
      </Card>
    );
  }

  const passRate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;
  const failRate = summary.total > 0 ? (summary.failed / summary.total) * 100 : 0;
  const skippedRate = summary.total > 0 ? (summary.skipped / summary.total) * 100 : 0;

  const testMetricBars = [
    { label: 'Pass Rate', value: passRate },
    { label: 'Fail Rate', value: failRate },
    { label: 'Skipped Rate', value: skippedRate },
  ];

  return (
    <Card header={<h2 className="text-xl font-semibold">Test Result Visualization</h2>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total" value={summary.total} />
        <StatCard label="Passed" value={summary.passed} />
        <StatCard label="Failed" value={summary.failed} />
        <StatCard label="Skipped" value={summary.skipped} />
      </div>

      <div className="space-y-4">
        {testMetricBars.map((metric) => (
          <MetricBar key={metric.label} label={metric.label} value={metric.value} />
        ))}
      </div>
    </Card>
  );
}

function CoverageMetrics({ coverage }: { coverage: CoverageSummary | null }) {
  const coverageMetrics = [
    coverage?.statements,
    coverage?.lines,
    coverage?.branches,
    coverage?.functions,
  ].filter((metric): metric is CoverageMetric => Boolean(metric));

  if (coverageMetrics.length === 0) {
    return (
      <Card>
        <p className="text-gray-600">
          No coverage report found yet. Run "Frontend coverage (Jest)" to generate coverage visuals.
        </p>
      </Card>
    );
  }

  return (
    <Card header={<h2 className="text-xl font-semibold">Coverage Visualization</h2>}>
      <div className="space-y-4">
        {coverageMetrics.map((metric) => (
          <MetricBar key={metric.label} label={metric.label} value={metric.percent} />
        ))}
      </div>
    </Card>
  );
}

export default function TestingDashboardClient() {
  const [commands, setCommands] = useState<CommandConfig[]>([]);
  const [coverage, setCoverage] = useState<CoverageSummary | null>(null);
  const [latestResult, setLatestResult] = useState<TestRunResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningCommandId, setIsRunningCommandId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch('/api/dev/testing');
        if (!response.ok) {
          throw new Error('Failed to load testing dashboard data');
        }

        const data = await response.json();
        setCommands(data.commands || []);
        setCoverage(data.coverage || null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleRunCommand = async (commandId: string) => {
    setError('');
    setIsRunningCommandId(commandId);

    try {
      const response = await fetch('/api/dev/testing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commandId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || 'Failed to execute test command');
      }

      const result = (await response.json()) as TestRunResult;
      setLatestResult(result);
      setCoverage(result.coverage || null);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Failed to execute command');
    } finally {
      setIsRunningCommandId(null);
    }
  };

  const latestSummary = latestResult?.summary ?? null;

  const runMetadata = useMemo(() => {
    if (!latestResult) {
      return null;
    }

    const durationSeconds = (latestResult.durationMs / 1000).toFixed(2);
    const statusText = latestResult.success ? 'Success' : `Failed (exit ${latestResult.exitCode})`;
    return `Last run: ${latestResult.commandLabel} • ${statusText} • ${durationSeconds}s`;
  }, [latestResult]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-6xl">
        <PageHeader
          title="Developer Testing Dashboard"
          description="Run project test suites and visualize pass/fail and coverage statistics."
        />
        <LoadingSpinner message="Loading testing dashboard..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-6xl space-y-6">
      <PageHeader
        title="Developer Testing Dashboard"
        description="Run project test suites and visualize pass/fail and coverage statistics."
      />

      {error && <ErrorMessage message={error} />}

      <Card header={<h2 className="text-xl font-semibold">Run Test Commands</h2>}>
        <div className="grid gap-3 md:grid-cols-2">
          {commands.map((command) => (
            <div key={command.id} className="border border-gray-200 rounded-xl p-4 bg-white">
              <p className="font-medium text-gray-900">{command.label}</p>
              <p className="text-sm text-gray-600 mt-1 mb-3">{command.description}</p>
              <Button
                onClick={() => handleRunCommand(command.id)}
                disabled={Boolean(isRunningCommandId)}
                className="w-full"
              >
                {isRunningCommandId === command.id ? 'Running...' : `Run ${command.label}`}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {runMetadata && (
        <Card>
          <p className="text-gray-700 font-medium">{runMetadata}</p>
        </Card>
      )}

      <SummaryMetrics summary={latestSummary} />
      <CoverageMetrics coverage={coverage} />

      <Card header={<h2 className="text-xl font-semibold">Latest Test Output</h2>}>
        <pre className="text-xs bg-gray-900 text-gray-100 rounded-xl p-4 overflow-auto max-h-[420px] whitespace-pre-wrap">
          {latestResult?.output ||
            'No command output yet. Run a test command from the panel above.'}
        </pre>
      </Card>
    </div>
  );
}
