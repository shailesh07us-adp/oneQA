import {
  forecastTimeSeries,
  calculateReleaseReadiness,
  calculateTestStability,
  calculateResolutionEfficiency,
  calculateRiskExposure,
  calculateAutomationROI,
  calculateEscapedDefectRate,
  calculateMTTRStatus,
  calculatePyramidHealth,
} from "./stats";

// ─── Types ───────────────────────────────────────────────────

export interface AdoDefect {
  id: number;
  title: string;
  severity: "1 - Critical" | "2 - High" | "3 - Medium" | "4 - Low";
  state: "Active" | "Resolved" | "Closed" | "New";
  assignedTo: string;
  createdDate: string;
  project: string;
  areaPath: string;
}

export interface DefectTrendPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  opened: number;
  resolved: number;
  isForecast?: boolean; // true for predicted future points
}

export interface TestPlanSummary {
  name: string;
  project: string;
  totalTests: number;
  automated: number;
  manual: number;
  passedPercent: number;
}

export interface AdoDashboardData {
  defects: {
    p1: number;
    p2: number;
    p3: number;
    p4: number;
    total: number;
    activeCount: number;
    resolvedLast7Days: number;
    trend: DefectTrendPoint[];
  };
  testPlans: TestPlanSummary[];
  projectHealth: {
    project: string;
    passRate: number;
    activeBugs: number;
    health: "green" | "yellow" | "red";
  }[];
  releaseReadiness: {
    score: number;
    label: string;
    color: string;
    breakdown: {
      category: string;
      score: number;
      weight: number;
      weighted: number;
      insight: string;
    }[];
  };
  stability: {
    score: number;
    label: string;
    color: string;
  };
  efficiency: {
    score: number;
    label: string;
    color: string;
  };
  threatLevel: {
    score: number;
    label: string;
    color: string;
  };
  businessValue: {
    roi: {
      hoursSaved: number;
      moneySaved: number;
      formattedMoney: string;
    };
    escapedDefects: {
      rate: number;
      label: string;
      color: string;
      prodCount: number;
      qaCount: number;
    };
    mttr: {
      avgDays: number;
      label: string;
      color: string;
    };
    pyramid: {
      unitPerc: number;
      integrationPerc: number;
      e2ePerc: number;
      isHealthy: boolean;
      recommendation: string;
    };
  };
  isLive: boolean;
}

// ─── Configuration ───────────────────────────────────────────

const ADO_ORG_URL = process.env.ADO_ORG_URL || "";
const ADO_PROJECT = process.env.ADO_PROJECT || "";
const ADO_PAT = process.env.ADO_PAT || "";

function isLiveConfigured(): boolean {
  return !!(ADO_ORG_URL && ADO_PAT);
}

// ─── Live ADO Fetch (used when PAT is configured) ────────────

interface AdoWorkItem {
  id: number;
  fields: {
    "System.Title": string;
    "Microsoft.VSTS.Common.Severity"?: string;
    "System.State": string;
    "System.AssignedTo"?: { displayName: string };
    "System.CreatedDate": string;
    "System.TeamProject": string;
    "System.AreaPath": string;
  };
}

async function fetchFromAdo(path: string, body?: any): Promise<any> {
  const base = ADO_ORG_URL.replace(/\/$/, "");
  const url = `${base}/${path}`;
  const authHeader = "Basic " + Buffer.from(`:${ADO_PAT}`).toString("base64");

  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: 300 }, // cache for 5 min
  });

  if (!res.ok) {
    throw new Error(`ADO API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchLiveDefects(): Promise<AdoDefect[]> {
  const project = ADO_PROJECT || "_";

  // WIQL query to get bugs
  const wiqlBody = {
    query: `SELECT [System.Id], [System.Title], [Microsoft.VSTS.Common.Severity],
            [System.State], [System.AssignedTo], [System.CreatedDate],
            [System.TeamProject], [System.AreaPath]
            FROM workitems
            WHERE [System.WorkItemType] = 'Bug'
            AND [System.State] <> 'Removed'
            ORDER BY [System.CreatedDate] DESC`,
  };

  const wiqlResult = await fetchFromAdo(
    `${project}/_apis/wit/wiql?api-version=7.0`,
    wiqlBody
  );

  if (!wiqlResult.workItems?.length) return [];

  const ids = wiqlResult.workItems
    .slice(0, 200)
    .map((w: { id: number }) => w.id)
    .join(",");

  const itemsResult = await fetchFromAdo(
    `_apis/wit/workitems?ids=${ids}&fields=System.Id,System.Title,Microsoft.VSTS.Common.Severity,System.State,System.AssignedTo,System.CreatedDate,System.TeamProject,System.AreaPath&api-version=7.0`
  );

  return (itemsResult.value || []).map((item: AdoWorkItem) => ({
    id: item.id,
    title: item.fields["System.Title"],
    severity: item.fields["Microsoft.VSTS.Common.Severity"] || "3 - Medium",
    state: item.fields["System.State"],
    assignedTo: item.fields["System.AssignedTo"]?.displayName || "Unassigned",
    createdDate: item.fields["System.CreatedDate"],
    project: item.fields["System.TeamProject"],
    areaPath: item.fields["System.AreaPath"],
  }));
}

// ─── Mock Data (used when PAT is NOT configured) ─────────────

function generateMockDefectTrend(): DefectTrendPoint[] {
  const trend: DefectTrendPoint[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    trend.push({
      date: d.toISOString().split("T")[0],
      opened: Math.floor(Math.random() * 6) + 1,
      resolved: Math.floor(Math.random() * 7) + 2,
    });
  }
  return trend;
}

function generateMockTestPlans(): TestPlanSummary[] {
  return [
    {
      name: "Sprint 24 Regression",
      project: "Payment Gateway",
      totalTests: 342,
      automated: 298,
      manual: 44,
      passedPercent: 94,
    },
    {
      name: "API Integration Tests",
      project: "Auth Service",
      totalTests: 187,
      automated: 187,
      manual: 0,
      passedPercent: 98,
    },
    {
      name: "E2E User Flows",
      project: "Web Portal",
      totalTests: 156,
      automated: 112,
      manual: 44,
      passedPercent: 87,
    },
    {
      name: "Performance Suite",
      project: "Core Platform",
      totalTests: 64,
      automated: 64,
      manual: 0,
      passedPercent: 91,
    },
  ];
}

function generateMockProjectHealth(): AdoDashboardData["projectHealth"] {
  return [
    { project: "Payment Gateway", passRate: 94, activeBugs: 3, health: "green" },
    { project: "Auth Service", passRate: 98, activeBugs: 1, health: "green" },
    { project: "Web Portal", passRate: 72, activeBugs: 8, health: "red" },
    { project: "Core Platform", passRate: 85, activeBugs: 5, health: "yellow" },
    { project: "Mobile API", passRate: 91, activeBugs: 2, health: "green" },
    {
      project: "Reporting Engine",
      passRate: 78,
      activeBugs: 6,
      health: "yellow",
    },
  ];
}

function getMockData(): AdoDashboardData {
  const trend = generateMockDefectTrend();
  const totalResolved = trend.reduce((s, t) => s + t.resolved, 0);

  // Generate 7-day forecast
  const openedForecast = forecastTimeSeries(trend.map((t) => t.opened), 7);
  const resolvedForecast = forecastTimeSeries(trend.map((t) => t.resolved), 7);
  const lastDate = new Date(trend[trend.length - 1].date);

  const trendWithForecast = [...trend];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i + 1);
    trendWithForecast.push({
      date: d.toISOString().split("T")[0],
      opened: openedForecast[i],
      resolved: resolvedForecast[i],
      isForecast: true,
    });
  }

  // Release Readiness (mock)
  const readiness = calculateReleaseReadiness({
    passRate: 90,
    passRatePrevious: 87,
    activeP1P2Bugs: 16, // p1 + p2
    flakyTestRatio: 0.08,
    testPlanCompletion: 92,
  });

  return {
    defects: {
      p1: 4,
      p2: 12,
      p3: 23,
      p4: 8,
      total: 47,
      activeCount: 19,
      resolvedLast7Days: Math.min(totalResolved, 18),
      trend: trendWithForecast,
    },
    testPlans: generateMockTestPlans(),
    projectHealth: generateMockProjectHealth(),
    releaseReadiness: readiness,
    stability: calculateTestStability(12, 150),
    efficiency: calculateResolutionEfficiency(58, 52),
    threatLevel: calculateRiskExposure(16, 4, 12),
    businessValue: {
      roi: calculateAutomationROI(15420, 10, 65), // 15k executions, 10m each
      escapedDefects: {
        ...calculateEscapedDefectRate(8, 142),
        prodCount: 8,
        qaCount: 142
      },
      mttr: {
        avgDays: 2.4,
        ...calculateMTTRStatus(2.4)
      },
      pyramid: calculatePyramidHealth(640, 210, 85)
    },
    isLive: false,
  };
}

// ─── Public API ──────────────────────────────────────────────

export async function getAdoDashboardData(): Promise<AdoDashboardData> {
  if (!isLiveConfigured()) {
    return getMockData();
  }

  try {
    const defects = await fetchLiveDefects();

    const p1 = defects.filter((d) => d.severity.startsWith("1")).length;
    const p2 = defects.filter((d) => d.severity.startsWith("2")).length;
    const p3 = defects.filter((d) => d.severity.startsWith("3")).length;
    const p4 = defects.filter((d) => d.severity.startsWith("4")).length;
    const activeCount = defects.filter((d) => d.state === "Active" || d.state === "New").length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const resolvedLast7Days = defects.filter(
      (d) => (d.state === "Resolved" || d.state === "Closed") && new Date(d.createdDate) >= sevenDaysAgo
    ).length;

    // Build 30-day trend from defects
    const trend: DefectTrendPoint[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const opened = defects.filter((def) => def.createdDate.startsWith(dateStr)).length;
      const resolved = defects.filter(
        (def) => (def.state === "Resolved" || def.state === "Closed") && def.createdDate.startsWith(dateStr)
      ).length;
      trend.push({ date: dateStr, opened, resolved });
    }

    // Project-level health
    const projectNames = Array.from(new Set(defects.map((d) => d.project)));
    const projectHealth = projectNames.map((project) => {
      const projectDefects = defects.filter((d) => d.project === project);
      const activeBugs = projectDefects.filter((d) => d.state === "Active" || d.state === "New").length;
      const p1p2 = projectDefects.filter((d) => d.severity.startsWith("1") || d.severity.startsWith("2")).filter((d) => d.state === "Active" || d.state === "New").length;
      const health: "green" | "yellow" | "red" = p1p2 > 3 ? "red" : p1p2 > 0 ? "yellow" : "green";
      return { project, passRate: 0, activeBugs, health };
    });

    return {
      defects: {
        p1,
        p2,
        p3,
        p4,
        total: defects.length,
        activeCount,
        resolvedLast7Days,
        trend,
      },
      testPlans: generateMockTestPlans(), // Test Plans API requires additional setup; use mock for now
      projectHealth,
      releaseReadiness: {
        score: 50,
        label: "Needs Attention",
        color: "#f59e0b",
        breakdown: [],
      },
      stability: calculateTestStability(0, 0),
      efficiency: calculateResolutionEfficiency(0, 0),
      threatLevel: calculateRiskExposure(0, 0, 0),
      businessValue: {
        roi: { hoursSaved: 0, moneySaved: 0, formattedMoney: "$0" },
        escapedDefects: { rate: 0, label: "N/A", color: "#64748b", prodCount: 0, qaCount: 0 },
        mttr: { avgDays: 0, label: "N/A", color: "#64748b" },
        pyramid: { unitPerc: 0, integrationPerc: 0, e2ePerc: 0, isHealthy: true, recommendation: "" }
      },
      isLive: true,
    };
  } catch (error) {
    console.error("Failed to fetch live ADO data, falling back to mock:", error);
    return getMockData();
  }
}
