import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || ((session.user as any).globalRole !== "ADMIN")) {
    // For now, only global ADMIN can see all approvals.
    // If it's a Project Lead, we should filter by their project.
    // However, pending users don't have a project yet.
    // We'll simplify: ADMIN sees all, Project Lead (later) sees those who requested their project.
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const pendingUsers = await prisma.user.findMany({
    where: { status: "PENDING" },
    orderBy: { requestedAt: "desc" },
  });

  return NextResponse.json(pendingUsers);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || ((session.user as any).globalRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { userId, action } = await request.json(); // action: "APPROVE" | "REJECT"

    if (!userId || !action) {
      return NextResponse.json({ error: "User ID and action are required" }, { status: 400 });
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      user: { id: updatedUser.id, name: updatedUser.name, status: (updatedUser as any).status },
    });
  } catch (error) {
    console.error("User approval error:", error);
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}
