import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "14");
    const projectId = searchParams.get("projectId");

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where: any = { startTime: { gte: since } };
    if (projectId) where.projectId = projectId;

    const runs = await prisma.testRun.findMany({
      where,
      orderBy: { startTime: "asc" },
      select: { startTime: true, status: true, duration: true, project: true },
    });

    // Aggregate by day
    const dailyMap: Record<string, { date: string; passed: number; failed: number; total: number; avgDuration: number; totalDuration: number }> = {};

    runs.forEach((run: any) => {
      const day = new Date(run.startTime).toISOString().split("T")[0];
      if (!dailyMap[day]) {
        dailyMap[day] = { date: day, passed: 0, failed: 0, total: 0, avgDuration: 0, totalDuration: 0 };
      }
      dailyMap[day].total++;
      if (run.status === "passed") dailyMap[day].passed++;
      else dailyMap[day].failed++;
      dailyMap[day].totalDuration += run.duration || 0;
    });

    const trendData = Object.values(dailyMap)
      .map((d) => ({
        ...d,
        avgDuration: Math.round(d.totalDuration / d.total / 1000),
        successRate: Math.round((d.passed / d.total) * 100),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(trendData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch trends" }, { status: 500 });
  }
}
