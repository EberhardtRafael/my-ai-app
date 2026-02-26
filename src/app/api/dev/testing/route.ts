import { exec } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { DEV_MODE_COOKIE_NAME, hasDeveloperAccess } from '@/utils/devMode';

const execAsync = promisify(exec);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CommandId =
  | 'frontend'
  | 'frontend-coverage'
  | 'backend'
  | 'all'
  | 'smoke-frontend'
  | 'smoke-backend'
  | 'smoke-all';

type TestCommand = {
  id: CommandId;
  label: string;
  description: string;
  command: string;
  parser: 'jest' | 'pytest' | 'mixed';
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

const TEST_COMMANDS: Record<CommandId, TestCommand> = {
  frontend: {
    id: 'frontend',
    label: 'Frontend tests (Jest)',
    description: 'Runs the frontend Jest suite once in CI mode.',
    command: 'yarn test --runInBand --ci --colors=false',
    parser: 'jest',
  },
  'frontend-coverage': {
    id: 'frontend-coverage',
    label: 'Frontend coverage (Jest)',
    description: 'Runs frontend tests with coverage report generation.',
    command: 'yarn test:coverage --ci --colors=false',
    parser: 'jest',
  },
  backend: {
    id: 'backend',
    label: 'Backend tests (Pytest)',
    description: 'Runs Python backend tests with verbose output.',
    command: 'yarn test:python',
    parser: 'pytest',
  },
  'smoke-frontend': {
    id: 'smoke-frontend',
    label: 'Smoke: Frontend critical paths',
    description: 'Runs a fast frontend smoke suite for key user-surface behaviors.',
    command: 'yarn test:smoke:frontend',
    parser: 'jest',
  },
  'smoke-backend': {
    id: 'smoke-backend',
    label: 'Smoke: Backend API critical paths',
    description: 'Runs core GraphQL API smoke checks including PDP related-products query.',
    command: 'yarn test:smoke:backend',
    parser: 'pytest',
  },
  'smoke-all': {
    id: 'smoke-all',
    label: 'Smoke: Full critical flow',
    description: 'Runs frontend and backend smoke suites sequentially.',
    command: 'yarn test:smoke',
    parser: 'mixed',
  },
  all: {
    id: 'all',
    label: 'All test suites',
    description: 'Runs frontend and backend test suites sequentially.',
    command: 'yarn test:all',
    parser: 'mixed',
  },
};

const parseCount = (text: string, label: string): number => {
  const match = text.match(new RegExp(`(\\d+)\\s+${label}`, 'i'));
  return match ? Number.parseInt(match[1], 10) : 0;
};

const parseDuration = (text: string): number | null => {
  const jestDuration = text.match(/Time:\s*([\d.]+)\s*s/i);
  if (jestDuration) {
    return Number.parseFloat(jestDuration[1]);
  }

  const pytestDuration = text.match(/=+\s*.+\s+in\s+([\d.]+)s\s*=+/i);
  if (pytestDuration) {
    return Number.parseFloat(pytestDuration[1]);
  }

  return null;
};

const parseJestSummary = (text: string): TestSummary => {
  const passed = parseCount(text, 'passed');
  const failed = parseCount(text, 'failed');
  const skipped = parseCount(text, 'skipped');
  const total = parseCount(text, 'total') || passed + failed + skipped;

  return {
    passed,
    failed,
    skipped,
    total,
    durationSeconds: parseDuration(text),
  };
};

const parsePytestSummary = (text: string): TestSummary => {
  const passed = parseCount(text, 'passed');
  const failed = parseCount(text, 'failed');
  const skipped = parseCount(text, 'skipped');
  const total = passed + failed + skipped;

  return {
    passed,
    failed,
    skipped,
    total,
    durationSeconds: parseDuration(text),
  };
};

const parseMixedSummary = (text: string): TestSummary => {
  const jestSummary = parseJestSummary(text);
  const pytestSummary = parsePytestSummary(text);

  const combinedDuration = [jestSummary.durationSeconds, pytestSummary.durationSeconds]
    .filter((value): value is number => value !== null)
    .reduce((sum, value) => sum + value, 0);

  return {
    passed: jestSummary.passed + pytestSummary.passed,
    failed: jestSummary.failed + pytestSummary.failed,
    skipped: jestSummary.skipped + pytestSummary.skipped,
    total: jestSummary.total + pytestSummary.total,
    durationSeconds: combinedDuration || null,
  };
};

const toMetric = (label: string, covered: number, total: number): CoverageMetric => ({
  label,
  covered,
  total,
  percent: total > 0 ? Math.round((covered / total) * 10000) / 100 : 0,
});

const loadCoverageSummary = async (): Promise<CoverageSummary | null> => {
  const lcovPath = path.join(process.cwd(), 'coverage', 'lcov.info');

  try {
    const lcov = await readFile(lcovPath, 'utf-8');
    const lines = lcov.split('\n');

    let totalLines = 0;
    let coveredLines = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;

    for (const line of lines) {
      if (line.startsWith('LF:')) {
        totalLines += Number.parseInt(line.replace('LF:', ''), 10);
      }
      if (line.startsWith('LH:')) {
        coveredLines += Number.parseInt(line.replace('LH:', ''), 10);
      }
      if (line.startsWith('BRF:')) {
        totalBranches += Number.parseInt(line.replace('BRF:', ''), 10);
      }
      if (line.startsWith('BRH:')) {
        coveredBranches += Number.parseInt(line.replace('BRH:', ''), 10);
      }
      if (line.startsWith('FNF:')) {
        totalFunctions += Number.parseInt(line.replace('FNF:', ''), 10);
      }
      if (line.startsWith('FNH:')) {
        coveredFunctions += Number.parseInt(line.replace('FNH:', ''), 10);
      }
    }

    return {
      statements: toMetric('Statements', coveredLines, totalLines),
      lines: toMetric('Lines', coveredLines, totalLines),
      branches: toMetric('Branches', coveredBranches, totalBranches),
      functions: toMetric('Functions', coveredFunctions, totalFunctions),
    };
  } catch {
    return null;
  }
};

const summarizeOutput = (output: string): string => {
  const lines = output.split('\n');
  return lines.slice(Math.max(0, lines.length - 120)).join('\n');
};

const parseSummary = (parser: TestCommand['parser'], output: string): TestSummary => {
  if (parser === 'pytest') {
    return parsePytestSummary(output);
  }

  if (parser === 'mixed') {
    return parseMixedSummary(output);
  }

  return parseJestSummary(output);
};

export async function GET() {
  const cookieStore = await cookies();
  const devModeCookie = cookieStore.get(DEV_MODE_COOKIE_NAME)?.value;
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!hasDeveloperAccess({ role, cookieValue: devModeCookie })) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const coverage = await loadCoverageSummary();

  return NextResponse.json({
    commands: Object.values(TEST_COMMANDS).map(({ id, label, description }) => ({
      id,
      label,
      description,
    })),
    coverage,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const devModeCookie = cookieStore.get(DEV_MODE_COOKIE_NAME)?.value;
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!hasDeveloperAccess({ role, cookieValue: devModeCookie })) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const startedAt = new Date();

  try {
    const body = await request.json();
    const commandId = body?.commandId as CommandId | undefined;

    if (!commandId || !(commandId in TEST_COMMANDS)) {
      return NextResponse.json({ error: 'Invalid command id' }, { status: 400 });
    }

    const commandConfig = TEST_COMMANDS[commandId];

    try {
      const { stdout, stderr } = await execAsync(commandConfig.command, {
        cwd: process.cwd(),
        timeout: 10 * 60 * 1000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, CI: '1' },
      });

      const output = [stdout, stderr].filter(Boolean).join('\n');
      const summary = parseSummary(commandConfig.parser, output);
      const coverage = await loadCoverageSummary();
      const finishedAt = new Date();

      return NextResponse.json({
        commandId,
        commandLabel: commandConfig.label,
        success: true,
        exitCode: 0,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        summary,
        coverage,
        output: summarizeOutput(output),
      });
    } catch (error) {
      const executionError = error as Error & {
        code?: number;
        stdout?: string;
        stderr?: string;
      };

      const output = [executionError.stdout, executionError.stderr].filter(Boolean).join('\n');
      const summary = parseSummary(commandConfig.parser, output);
      const coverage = await loadCoverageSummary();
      const finishedAt = new Date();

      return NextResponse.json({
        commandId,
        commandLabel: commandConfig.label,
        success: false,
        exitCode: executionError.code ?? 1,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs: finishedAt.getTime() - startedAt.getTime(),
        summary,
        coverage,
        output: summarizeOutput(output || executionError.message),
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run tests' },
      { status: 500 }
    );
  }
}
