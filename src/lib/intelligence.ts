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

export function calculateConfidenceScore(runs: any[]): ConfidenceMetrics {
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

export function classifyFailures(runs: any[]) {
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

export function clusterFailures(runs: any[]) {
  const clusters: any[] = [];
  
  const allFailedTests: any[] = [];
  runs.forEach(run => {
    run.suites?.forEach((suite: any) => {
      suite.tests?.forEach((test: any) => {
        if (test.status === 'failed') {
          allFailedTests.push({
            ...test,
            suiteTitle: suite.title,
            runId: run.id,
            env: run.env,
            startTime: run.startTime
          });
        }
      });
    });
  });

  allFailedTests.forEach(test => {
    const fingerprint = getFingerprint(test.error);
    
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
