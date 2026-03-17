import { NextResponse } from "next/server";
import { getAdoDashboardData } from "@/lib/ado";

export async function GET() {
  try {
    const data = await getAdoDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("ADO API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ADO data" },
      { status: 500 }
    );
  }
}
