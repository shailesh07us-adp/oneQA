import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

interface RunRow {
  id: string;
  project: string;
  status: string;
  env: string;
  startTime: Date;
  duration: number | null;
  suites: SuiteRow[];
}

interface SuiteRow {
  tests: TestRow[];
}

interface TestRow {
  title: string;
  status: string;
  duration: number;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project = searchParams.get('project') || 'all';

    const where: Prisma.TestRunWhereInput = {};
    if (project !== 'all') {
      where.project = project;
    }

    const runs = (await prisma.testRun.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: { suites: { include: { tests: true } } },
    })) as unknown as RunRow[];

    // Fetch project list for the filter dropdown (always unfiltered)
    const allProjects = await prisma.project.findMany({
      where: { archived: false },
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    const projects = allProjects.map((p: { name: string }) => p.name).filter(Boolean);

    const totalRuns = runs.length;
    const passedRuns = runs.filter((r) => r.status === 'passed').length;
    const failedRuns = runs.filter((r) => r.status === 'failed').length;
    const successRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 0;

    // ── Avg execution time ────────────────────────────────────
    const durations = runs.map((r) => r.duration || 0);
    const avgDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const avgDurationSec = Math.round(avgDurationMs / 1000);

    // ── Run rate (runs per week, last 8 weeks) ────────────────
    const now = new Date();
    const weekBuckets: { week: string; count: number; avgDuration: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const label = `W-${i === 0 ? 'Now' : i}`;
      const weekRuns = runs.filter((r) => {
        const t = new Date(r.startTime);
        return t >= weekStart && t < weekEnd;
      });
      const wDurations = weekRuns.map((r) => r.duration || 0);
      const wAvg = wDurations.length > 0 ? Math.round(wDurations.reduce((a, b) => a + b, 0) / wDurations.length / 1000) : 0;
      weekBuckets.push({ week: label, count: weekRuns.length, avgDuration: wAvg });
    }

    const currentWeekRuns = weekBuckets[weekBuckets.length - 1]?.count || 0;

    // ── Release time reduction trend ──────────────────────────
    const validWeeks = weekBuckets.filter((w) => w.avgDuration > 0);
    let releaseTimeReduction = 0;
    if (validWeeks.length >= 2) {
      const earliest = validWeeks[0].avgDuration;
      const latest = validWeeks[validWeeks.length - 1].avgDuration;
      releaseTimeReduction = earliest > 0 ? Math.round(((earliest - latest) / earliest) * 100) : 0;
    }

    // ── Per-project failure density ───────────────────────────
    const projectMap: Record<string, { total: number; failed: number; tests: number }> = {};
    runs.forEach((r) => {
      if (!projectMap[r.project]) projectMap[r.project] = { total: 0, failed: 0, tests: 0 };
      projectMap[r.project].total++;
      if (r.status === 'failed') projectMap[r.project].failed++;
      r.suites?.forEach((s) => {
        projectMap[r.project].tests += s.tests?.length || 0;
      });
    });
    const failureDensity = Object.entries(projectMap)
      .map(([proj, d]) => ({
        project: proj,
        totalRuns: d.total,
        failedRuns: d.failed,
        density: d.total > 0 ? Math.round((d.failed / d.total) * 100) : 0,
        testCount: d.tests,
      }))
      .sort((a, b) => b.density - a.density);

    const overallFailureDensity = totalRuns > 0 ? Math.round((failedRuns / totalRuns) * 100) : 0;

    // ── Flaky test ratio ──────────────────────────────────────
    const testResults: Record<string, { passed: number; total: number }> = {};
    runs.forEach((r) =>
      r.suites?.forEach((s) =>
        s.tests?.forEach((t) => {
          if (!testResults[t.title]) testResults[t.title] = { passed: 0, total: 0 };
          testResults[t.title].total++;
          if (t.status === 'passed') testResults[t.title].passed++;
        })
      )
    );
    const uniqueTests = Object.keys(testResults).length;
    const flakyTests = Object.entries(testResults).filter(
      ([, v]) => v.passed < v.total && v.passed > 0
    );
    const flakyRatio = uniqueTests > 0 ? Math.round((flakyTests.length / uniqueTests) * 100) : 0;

    // ── Defect detection rate ─────────────────────────────────
    const failingUniqueTests = Object.entries(testResults).filter(([, v]) => v.passed < v.total).length;
    const defectDetectionRate = uniqueTests > 0 ? Math.round((failingUniqueTests / uniqueTests) * 100) : 0;

    // ── ROI & hours saved ─────────────────────────────────────
    const MANUAL_MULTIPLIER = 3;
    const COST_PER_HOUR = 50;
    const totalAutomatedHours = Math.round(durations.reduce((a, b) => a + b, 0) / 1000 / 3600 * 10) / 10;
    const manualEquivalentHours = Math.round(totalAutomatedHours * MANUAL_MULTIPLIER * 10) / 10;
    const hoursSaved = Math.round((manualEquivalentHours - totalAutomatedHours) * 10) / 10;
    const costSaved = Math.round(hoursSaved * COST_PER_HOUR);
    const investmentEstimate = Math.round(totalAutomatedHours * COST_PER_HOUR);
    const roi = investmentEstimate > 0 ? Math.round((costSaved / investmentEstimate) * 100) : 0;

    // ── Cost per bug found ────────────────────────────────────
    const costPerBug = failingUniqueTests > 0 ? Math.round(investmentEstimate / failingUniqueTests) : 0;

    // ── MTBF (mean time between failures) ─────────────────────
    const failedRunsSorted = runs
      .filter((r) => r.status === 'failed')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    let mtbfHours = 0;
    if (failedRunsSorted.length >= 2) {
      let totalGap = 0;
      for (let i = 1; i < failedRunsSorted.length; i++) {
        totalGap += new Date(failedRunsSorted[i].startTime).getTime() - new Date(failedRunsSorted[i - 1].startTime).getTime();
      }
      mtbfHours = Math.round(totalGap / (failedRunsSorted.length - 1) / 1000 / 3600 * 10) / 10;
    }

    // ── Environment comparison ────────────────────────────────
    const envMap: Record<string, { total: number; passed: number; failed: number; durations: number[]; tests: number }> = {};
    runs.forEach((r) => {
      const env = r.env || 'Unknown';
      if (!envMap[env]) envMap[env] = { total: 0, passed: 0, failed: 0, durations: [], tests: 0 };
      envMap[env].total++;
      if (r.status === 'passed') envMap[env].passed++;
      if (r.status === 'failed') envMap[env].failed++;
      if (r.duration) envMap[env].durations.push(r.duration);
      r.suites?.forEach((s) => {
        envMap[env].tests += s.tests?.length || 0;
      });
    });
    const environmentComparison = Object.entries(envMap)
      .map(([env, d]) => ({
        env,
        totalRuns: d.total,
        passedRuns: d.passed,
        failedRuns: d.failed,
        successRate: d.total > 0 ? Math.round((d.passed / d.total) * 100) : 0,
        failureDensity: d.total > 0 ? Math.round((d.failed / d.total) * 100) : 0,
        avgDuration: d.durations.length > 0 ? Math.round(d.durations.reduce((a, b) => a + b, 0) / d.durations.length / 1000) : 0,
        testCount: d.tests,
      }))
      .sort((a, b) => b.totalRuns - a.totalRuns);

    // ── Automation maturity score ─────────────────────────────
    const maturityScore = Math.round(
      successRate * 0.3 +
      (1 - flakyRatio / 100) * 100 * 0.2 +
      Math.min(100, Math.max(0, 100 - avgDurationSec)) * 0.15 +
      Math.min(100, uniqueTests * 5) * 0.15 +
      Math.min(100, Math.max(0, releaseTimeReduction + 50)) * 0.1 +
      Math.min(100, totalRuns) * 0.1
    );

    return NextResponse.json({
      projects,
      summary: {
        totalRuns,
        passedRuns,
        failedRuns,
        successRate,
        avgDurationSec,
        overallFailureDensity,
        flakyRatio,
        defectDetectionRate,
        uniqueTests,
        maturityScore,
        mtbfHours,
        releaseTimeReduction,
        currentWeekRuns,
      },
      roi: {
        percentage: roi,
        hoursSaved,
        costSaved,
        costPerBug,
        formattedSavings: costSaved >= 1000 ? `$${(costSaved / 1000).toFixed(1)}K` : `$${costSaved}`,
      },
      trends: {
        runRate: weekBuckets,
        releaseTimeTrend: weekBuckets.map((w) => ({ week: w.week, avgDuration: w.avgDuration })),
      },
      failureDensity,
      environmentComparison,
    });
  } catch (error) {
    console.error('Error computing Automation KPIs:', error);
    return NextResponse.json({ error: 'Failed to compute Automation KPIs' }, { status: 500 });
  }
}
