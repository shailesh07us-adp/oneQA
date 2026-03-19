import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const features = await prisma.featureRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(features);
  } catch (error) {
    console.error("Fetch features error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feature requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, type, userName, userEmail } = body;

    if (!title || !description || !type) {
      return NextResponse.json(
        { error: "Title, description, and type are required" },
        { status: 400 }
      );
    }

    const featureRequest = await prisma.featureRequest.create({
      data: {
        title,
        description,
        type,
        userName,
        userEmail,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: featureRequest });
  } catch (error) {
    console.error("Feature request error:", error);
    return NextResponse.json(
      { error: "Failed to create feature request" },
      { status: 500 }
    );
  }
}
