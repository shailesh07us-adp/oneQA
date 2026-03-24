import { NextResponse } from "next/server";
import { getAdoDashboardData } from "@/lib/ado";

export async function GET() {
  try {
    const data = await getAdoDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Predictive Analysis API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Predictive Analysis data" },
      { status: 500 }
    );
  }
}
