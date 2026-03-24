import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface TestInfo {
  id: string;
  title: string;
  status: string;
  duration: number;
  error: string | null;
  suite: string;
}

interface DiffEntry {
  title: string;
  suite: string;
  type: 'regression' | 'fixed' | 'added' | 'removed' | 'unchanged';
  runA: { status: string; duration: number } | null;
  runB: { status: string; duration: number } | null;
  durationDelta: number | null;
}

function flattenTests(run: {
  suites: { title: string; tests: { id: string; title: string; status: string; duration: number; error: string | null }[] }[];
}): TestInfo[] {
  const tests: TestInfo[] = [];
  for (const suite of run.suites) {
    for (const test of suite.tests) {
      tests.push({
        id: test.id,
        title: test.title,
        status: test.status,
        duration: test.duration,
        error: test.error,
        suite: suite.title,
      });
    }
  }
  return tests;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const runAId = searchParams.get('runA');
    const runBId = searchParams.get('runB');

    if (!runAId || !runBId) {
      return NextResponse.json({ error: 'Both runA and runB query params are required' }, { status: 400 });
    }

    const [runA, runB] = await Promise.all([
      prisma.testRun.findUnique({
        where: { id: runAId },
        include: { suites: { include: { tests: true } } },
      }),
      prisma.testRun.findUnique({
        where: { id: runBId },
        include: { suites: { include: { tests: true } } },
      }),
    ]);

    if (!runA || !runB) {
      return NextResponse.json({ error: 'One or both runs not found' }, { status: 404 });
    }

    const testsA = flattenTests(runA as any);
    const testsB = flattenTests(runB as any);

    // Build maps keyed by test title
    const mapA = new Map<string, TestInfo>();
    testsA.forEach(t => mapA.set(t.title, t));

    const mapB = new Map<string, TestInfo>();
    testsB.forEach(t => mapB.set(t.title, t));

    const allTitles = new Set([...mapA.keys(), ...mapB.keys()]);

    const diff: DiffEntry[] = [];
    let regressions = 0;
    let fixed = 0;
    let added = 0;
    let removed = 0;
    let unchanged = 0;

    for (const title of allTitles) {
      const a = mapA.get(title) || null;
      const b = mapB.get(title) || null;

      let type: DiffEntry['type'];

      if (!a && b) {
        type = 'added';
        added++;
      } else if (a && !b) {
        type = 'removed';
        removed++;
      } else if (a && b) {
        const aFailed = a.status === 'failed';
        const bFailed = b.status === 'failed';
        const aPassed = a.status === 'passed';
        const bPassed = b.status === 'passed';

        if (aPassed && bFailed) {
          type = 'regression';
          regressions++;
        } else if (aFailed && bPassed) {
          type = 'fixed';
          fixed++;
        } else {
          type = 'unchanged';
          unchanged++;
        }
      } else {
        type = 'unchanged';
        unchanged++;
      }

      diff.push({
        title,
        suite: b?.suite || a?.suite || '',
        type,
        runA: a ? { status: a.status, duration: a.duration } : null,
        runB: b ? { status: b.status, duration: b.duration } : null,
        durationDelta: a && b ? b.duration - a.duration : null,
      });
    }

    // Sort: regressions first, then fixed, added, removed, unchanged
    const typePriority: Record<string, number> = { regression: 0, fixed: 1, added: 2, removed: 3, unchanged: 4 };
    diff.sort((x, y) => (typePriority[x.type] ?? 5) - (typePriority[y.type] ?? 5));

    return NextResponse.json({
      runA: {
        id: runA.id,
        project: runA.project,
        env: runA.env,
        status: runA.status,
        startTime: runA.startTime,
        duration: runA.duration,
        totalTests: testsA.length,
      },
      runB: {
        id: runB.id,
        project: runB.project,
        env: runB.env,
        status: runB.status,
        startTime: runB.startTime,
        duration: runB.duration,
        totalTests: testsB.length,
      },
      summary: {
        total: allTitles.size,
        regressions,
        fixed,
        added,
        removed,
        unchanged,
        durationDelta: (runB.duration || 0) - (runA.duration || 0),
      },
      diff,
    });
  } catch (error) {
    console.error('Compare runs error:', error);
    return NextResponse.json({ error: 'Failed to compare runs' }, { status: 500 });
  }
}
