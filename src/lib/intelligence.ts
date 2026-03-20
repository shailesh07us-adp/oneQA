/**
 * Intelligence Engine for OneQA
 * Provides advanced heuristics for release readiness and failure analysis.
 */

export interface ConfidenceMetrics {
  score: number;
  stability: number; // 0-100
  coverage: number;  // 0-100
  velocity: number;  // 0-100 (speed vs historical avg)
  trend: 'up' | 'down' | 'stable';
}

export interface Test {
  id: string;
  title: string;
  status: string;
  error?: string;
  stack?: string;
  duration?: number;
}

export interface Suite {
  id: string;
  title: string;
  tests?: Test[];
}

export interface Run {
  id: string;
  project: string;
  status: string;
  duration?: number;
  isFlaky?: boolean;
  suites?: Suite[];
  env: string;
  startTime: string | Date;
}

export function calculateConfidenceScore(runs: Run[]): ConfidenceMetrics {
  if (!runs || runs.length === 0) {
    return { score: 0, stability: 0, coverage: 0, velocity: 0, trend: 'stable' };
  }

  const recentRuns = runs.slice(0, 50);
  const passed = recentRuns.filter(r => r.status === 'passed').length;
  
  // 1. Stability (Pass Rate) - 50% weight
  const stability = (passed / recentRuns.length) * 100;

  // 2. Coverage Simulation (based on project variety) - 25% weight
  const projectCount = new Set(runs.map(r => r.project)).size;
  const coverage = Math.min(100, projectCount * 20); // 5 projects = 100%

  // 3. Velocity (Duration change) - 25% weight
  // Simple heuristic: if recent runs are faster than average, velocity is high
  const avgDuration = runs.reduce((acc, r) => acc + (r.duration || 0), 0) / runs.length;
  const recentAvg = recentRuns.reduce((acc, r) => acc + (r.duration || 0), 0) / recentRuns.length;
  const velocity = recentAvg <= avgDuration ? 100 : Math.max(0, 100 - ((recentAvg - avgDuration) / avgDuration) * 100);

  const score = Math.round((stability * 0.5) + (coverage * 0.25) + (velocity * 0.25));

  // Trend detection
  const previousRuns = runs.slice(50, 100);
  const prevPassed = previousRuns.filter(r => r.status === 'passed').length;
  const prevStability = previousRuns.length > 0 ? (prevPassed / previousRuns.length) * 100 : stability;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (stability > prevStability + 2) trend = 'up';
  if (stability < prevStability - 2) trend = 'down';

  return { score, stability, coverage, velocity, trend };
}

export function classifyFailures(runs: Run[]) {
  const failures = runs.filter(r => r.status === 'failed');
  const classified = {
    infrastructure: 0,
    bug: 0,
    flaky: 0
  };

  failures.forEach(run => {
    // Heuristic: Short duration + fail often = likely infrastructure/timeout
    if (run.duration && run.duration < 2000) {
      classified.infrastructure++;
    } else if (run.isFlaky) { // Assuming we have or will have this flag
      classified.flaky++;
    } else {
      classified.bug++;
    }
  });

  return classified;
}

export function getFingerprint(error: string | null): string {
  if (!error) return 'Unknown Error';
  return error
    .replace(/\d+/g, 'X')
    .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, 'GUID')
    .replace(/(?:\d{4}-\d{2}-\d{2})|(?:\d{2}:\d{2}:\d{2})/g, 'TIME')
    .replace(/at\s+.*:\d+:\d+/g, 'LOC')
    .substring(0, 200)
    .trim();
}

export interface FailureCluster {
  id: string;
  title: string;
  fingerprint: string;
  count: number;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  envs: Set<string>;
  description: string;
  failures: {
    id: string;
    title: string;
    suite: string;
    time: string;
    error?: string;
    stack?: string;
    runId: string;
    env: string;
  }[];
  envList?: string[];
}

export function clusterFailures(runs: Run[]) {
  const clusters: FailureCluster[] = [];
  
  const allFailedTests: (Test & { 
    suiteTitle: string; 
    runId: string; 
    env: string; 
    startTime: string | Date; 
  })[] = [];

  runs.forEach(run => {
    run.suites?.forEach((suite: Suite) => {
      suite.tests?.forEach((test: Test) => {
        const isActuallyFailed = test.status === 'failed';
        const isNonPassingInFailedRun = test.status !== 'passed' && run.status === 'failed';
        
        if (isActuallyFailed || isNonPassingInFailedRun) {
          allFailedTests.push({
            ...test,
            suiteTitle: suite.title,
            runId: run.id,
            env: run.env,
            startTime: run.startTime,
            // Provide a descriptive error if none exists for non-passing tests
            error: test.error || (isNonPassingInFailedRun ? `Test ${test.status} in a failed run` : "Unknown Error")
          });
        }
      });
    });
  });

  allFailedTests.forEach(test => {
    const fingerprint = getFingerprint(test.error || null);
    
    let cluster = clusters.find(c => c.fingerprint === fingerprint);
    if (!cluster) {
      cluster = {
        id: `cluster-${clusters.length + 1}`,
        title: test.error ? (test.error.length > 80 ? test.error.substring(0, 80) + '...' : test.error) : 'Unknown Regression',
        fingerprint,
        count: 0,
        severity: 'MEDIUM',
        envs: new Set(),
        description: test.error || 'No error message captured.',
        failures: []
      };
      clusters.push(cluster);
    }
    
    cluster.count++;
    cluster.envs.add(test.env);
    cluster.failures.push({
      id: test.id,
      title: test.title,
      suite: test.suiteTitle,
      time: new Date(test.startTime).toLocaleTimeString(),
      error: test.error,
      stack: test.stack,
      runId: test.runId,
      env: test.env
    });
  });

  // Calculate Expert Severity
  clusters.forEach(cluster => {
    cluster.envList = Array.from(cluster.envs);
    if (cluster.envList.includes('PRODUCTION')) {
      cluster.severity = 'CRITICAL';
    } else if (cluster.envList.length > 1) {
      cluster.severity = 'HIGH';
    }
  });

  return clusters;
}
