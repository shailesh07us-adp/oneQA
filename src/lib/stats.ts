/**
 * Simple statistical utilities for predictive analytics.
 * No external dependencies — pure math.
 */

/**
 * Simple Linear Regression: y = mx + b
 * Returns slope (m) and intercept (b).
 */
export function linearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  predict: (x: number) => number;
  r2: number; // coefficient of determination
} {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0, predict: () => 0, r2: 0 };

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const predict = (x: number) => Math.max(0, Math.round(slope * x + intercept));

  // R² calculation
  const meanY = sumY / n;
  const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0);
  const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, predict, r2 };
}

/**
 * Generate a 7-day forecast from a time series.
 * Uses the last 14 data points for the regression to make it more recent-biased.
 */
export function forecastTimeSeries(
  data: number[],
  forecastDays: number = 7
): number[] {
  // Use the last 14 days (or all data if less)
  const recentWindow = Math.min(14, data.length);
  const recentData = data.slice(-recentWindow);

  const points = recentData.map((y, i) => ({ x: i, y }));
  const { predict } = linearRegression(points);

  const forecast: number[] = [];
  for (let i = 1; i <= forecastDays; i++) {
    forecast.push(predict(recentWindow - 1 + i));
  }

  return forecast;
}

/**
 * Calculate a Release Readiness Score (0-100).
 *
 * Weights:
 * - Test Pass Rate:          35%  (higher is better)
 * - Pass Rate Trend:         15%  (improving = bonus, declining = penalty)
 * - Active P1/P2 Bugs:       20%  (fewer is better)
 * - Flaky Test Ratio:         15%  (fewer is better)
 * - Test Plan Completion:     15%  (higher is better)
 */
export function calculateReleaseReadiness(input: {
  passRate: number;                // 0-100
  passRatePrevious: number;        // 0-100 (from previous period)
  activeP1P2Bugs: number;          // raw count
  flakyTestRatio: number;          // 0-1 (fraction of tests that are flaky)
  testPlanCompletion: number;      // 0-100
}): {
  score: number;
  label: "Ready to Ship" | "Needs Attention" | "High Risk";
  color: string;
  breakdown: {
    category: string;
    score: number;
    weight: number;
    weighted: number;
    insight: string;
  }[];
} {
  const { passRate, passRatePrevious, activeP1P2Bugs, flakyTestRatio, testPlanCompletion } = input;

  // 1. Pass Rate Score (0-100)
  const passRateScore = Math.min(100, passRate);

  // 2. Trend Score: +10 if improving, -10 if declining, 0 if stable
  const trendDelta = passRate - passRatePrevious;
  const trendScore = Math.min(100, Math.max(0,
    50 + trendDelta * 5 // each 1% change = 5 points adjustment from baseline 50
  ));

  // 3. Bug Severity Score: 100 = no bugs, 0 = 10+ P1/P2 bugs
  const bugScore = Math.max(0, Math.min(100, 100 - activeP1P2Bugs * 10));

  // 4. Flakiness Score: 100 = no flaky, 0 = all flaky
  const flakinessScore = Math.round((1 - flakyTestRatio) * 100);

  // 5. Test Plan Completion Score
  const completionScore = Math.min(100, testPlanCompletion);

  // Weighted sum
  const breakdown = [
    { category: "Pass Rate", score: passRateScore, weight: 0.35, weighted: passRateScore * 0.35, insight: `${passRate}% of tests passing` },
    { category: "Trend Direction", score: trendScore, weight: 0.15, weighted: trendScore * 0.15, insight: trendDelta > 0 ? `↑ Improving (+${trendDelta.toFixed(1)}%)` : trendDelta < 0 ? `↓ Declining (${trendDelta.toFixed(1)}%)` : "→ Stable" },
    { category: "P1/P2 Bugs", score: bugScore, weight: 0.20, weighted: bugScore * 0.20, insight: `${activeP1P2Bugs} active critical bugs` },
    { category: "Test Stability", score: flakinessScore, weight: 0.15, weighted: flakinessScore * 0.15, insight: `${Math.round(flakyTestRatio * 100)}% tests are flaky` },
    { category: "Plan Completion", score: completionScore, weight: 0.15, weighted: completionScore * 0.15, insight: `${testPlanCompletion}% of test plans complete` },
  ];

  const score = Math.round(breakdown.reduce((s, b) => s + b.weighted, 0));

  const label: "Ready to Ship" | "Needs Attention" | "High Risk" =
    score >= 80 ? "Ready to Ship" : score >= 55 ? "Needs Attention" : "High Risk";

  const color = score >= 80 ? "#22c55e" : score >= 55 ? "#f59e0b" : "#ef4444";

  return { score, label, color, breakdown };
}
