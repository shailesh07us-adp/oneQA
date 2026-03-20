export function relativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

interface TestSuite {
  tests?: { status: string }[];
}

interface TestRun {
  project: string;
  env: string;
  startTime: string | Date;
  duration?: number;
  status: string;
  suites?: TestSuite[];
}

export function downloadCsv(runs: TestRun[], filename: string) {
  const headers = ['Project', 'Environment', 'Start Time', 'Duration (s)', 'Status', 'Suites', 'Tests Passed', 'Tests Failed'];
  const rows = runs.map((run: TestRun) => {
    const totalTests = run.suites?.reduce((s: number, suite: TestSuite) => s + (suite.tests?.length || 0), 0) || 0;
    const passedTests = run.suites?.reduce(
      (s: number, suite: TestSuite) => s + (suite.tests?.filter((t) => t.status === 'passed').length || 0), 0
    ) || 0;
    return [
      run.project,
      run.env,
      new Date(run.startTime).toISOString(),
      run.duration ? (run.duration / 1000).toFixed(1) : '0',
      run.status,
      run.suites?.length || 0,
      passedTests,
      totalTests - passedTests,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
