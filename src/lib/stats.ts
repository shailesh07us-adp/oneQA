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

/**
 * Calculates a Test Stability Index (0-100)
 * Higher is better. Based on flakiness/intermittent failure rate.
 */
export function calculateTestStability(flakyTests: number, totalTests: number): {
  score: number;
  label: string;
  color: string;
} {
  const stabilityPerc = totalTests > 0 ? ((totalTests - flakyTests) / totalTests) * 100 : 100;
  
  let label = "High Trust";
  let color = "#22c55e"; // emerald

  if (stabilityPerc < 75) {
    label = "Unreliable";
    color = "#ef4444"; // rose
  } else if (stabilityPerc < 92) {
    label = "Warning";
    color = "#f59e0b"; // amber
  }

  return { score: Math.round(stabilityPerc), label, color };
}

/**
 * Calculates Defect Resolution Efficiency (0-200+)
 * Target is > 100% (fixing more than you find)
 */
export function calculateResolutionEfficiency(resolved: number, opened: number): {
  score: number;
  label: string;
  color: string;
} {
  if (opened === 0) return { score: 100, label: "Healthy", color: "#22c55e" };
  
  const efficiency = (resolved / opened) * 100;
  
  let label = "Team Keeping Up";
  let color = "#22c55e";

  if (efficiency < 80) {
    label = "Backlog Growing";
    color = "#ef4444";
  } else if (efficiency < 100) {
    label = "Near Capacity";
    color = "#f59e0b";
  }

  return { score: Math.round(efficiency), label, color };
}

/**
 * Calculates a composite Risk Exposure Level (0-100)
 * LOWER IS BETTER. We invert it for the gauge display later if needed, 
 * or show as a "Threat Level".
 */
export function calculateRiskExposure(
  p1Count: number, 
  regressionFailures: number, 
  defectAgeDays: number
): {
  score: number;
  label: string;
  color: string;
} {
  // Score 0 (Safe) to 100 (Critical Danger)
  // Weights: P1s (50%), Regression (30%), Age (20%)
  const p1Weight = Math.min(p1Count * 10, 50);
  const regWeight = Math.min(regressionFailures * 15, 30);
  const ageWeight = Math.min(defectAgeDays / 2, 20);
  
  const totalRisk = p1Weight + regWeight + ageWeight;
  
  let label = "Safe";
  let color = "#22c55e";

  if (totalRisk > 70) {
    label = "Critical Threat";
    color = "#ef4444";
  } else if (totalRisk > 35) {
    label = "Elevated Risk";
    color = "#f59e0b";
  }

  return { score: Math.round(totalRisk), label, color };
}

/**
 * Calculates Automation ROI
 * Returns savings in hours and estimated dollar value.
 */
export function calculateAutomationROI(
  totalExecutions: number,
  avgManualTimePerTestMinutes: number,
  avgHourlyRate: number = 65
): {
  hoursSaved: number;
  moneySaved: number;
  formattedMoney: string;
} {
  const minutesSaved = totalExecutions * avgManualTimePerTestMinutes;
  const hoursSaved = Math.round(minutesSaved / 60);
  const moneySaved = hoursSaved * avgHourlyRate;
  
  const formattedMoney = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(moneySaved);

  return { hoursSaved, moneySaved, formattedMoney };
}

/**
 * Calculates Escaped Defect Rate
 * Higher is worse. Percentage of bugs found in Prod vs Total.
 */
export function calculateEscapedDefectRate(prodBugs: number, qaBugs: number): {
  rate: number;
  label: string;
  color: string;
} {
  const total = prodBugs + qaBugs;
  if (total === 0) return { rate: 0, label: "No bugs found", color: "#22c55e" };
  
  const rate = (prodBugs / total) * 100;
  
  let label = "World Class";
  let color = "#22c55e";

  if (rate > 15) {
    label = "Critical Leaks";
    color = "#ef4444";
  } else if (rate > 5) {
    label = "Needs Review";
    color = "#f59e0b";
  }

  return { rate: Math.round(rate), label, color };
}

/**
 * Calculates Mean Time to Repair (MTTR) status
 */
export function calculateMTTRStatus(avgDays: number): {
  label: string;
  color: string;
} {
  if (avgDays <= 1) return { label: "Elite", color: "#22c55e" };
  if (avgDays <= 3) return { label: "Good", color: "#3b82f6" };
  if (avgDays <= 7) return { label: "Average", color: "#f59e0b" };
  return { label: "Slow", color: "#ef4444" };
}

/**
 * Calculates Testing Pyramid Health
 */
export function calculatePyramidHealth(
  unit: number,
  integration: number,
  e2e: number
): {
  unitPerc: number;
  integrationPerc: number;
  e2ePerc: number;
  isHealthy: boolean;
  recommendation: string;
} {
  const total = unit + integration + e2e;
  if (total === 0) return { unitPerc: 0, integrationPerc: 0, e2ePerc: 0, isHealthy: true, recommendation: "No tests yet" };

  const unitPerc = (unit / total) * 100;
  const integrationPerc = (integration / total) * 100;
  const e2ePerc = (e2e / total) * 100;

  // Ideal: Unit (60-70%), Integration (20-30%), E2E (10%)
  const isHealthy = unitPerc > 50 && e2ePerc < 20;
  
  let recommendation = "Structure looks good.";
  if (unitPerc < 40) recommendation = "Focus on adding more Unit tests.";
  else if (e2ePerc > 25) recommendation = "Reduce dependency on slow E2E tests.";

  return {
    unitPerc: Math.round(unitPerc),
    integrationPerc: Math.round(integrationPerc),
    e2ePerc: Math.round(e2ePerc),
    isHealthy,
    recommendation
  };
}
