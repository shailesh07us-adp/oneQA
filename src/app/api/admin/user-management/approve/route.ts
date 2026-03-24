import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.globalRole !== "ADMIN")) {
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
  
  if (!session || (session.user.globalRole !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { userId, action } = await request.json(); // action: "APPROVE" | "REJECT"

    if (!userId || !action) {
      return NextResponse.json({ error: "User ID and action are required" }, { status: 400 });
    }

    const userToApprove = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToApprove) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      // Check if another user with the same email is already APPROVED
      const existingActiveUser = await prisma.user.findFirst({
        where: {
          email: userToApprove.email,
          status: "APPROVED",
          id: { not: userId }
        }
      });

      if (existingActiveUser) {
        return NextResponse.json({ 
          error: "A user with this active email already exists." 
        }, { status: 400 });
      }
    }

    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      user: { id: updatedUser.id, name: updatedUser.name, status: updatedUser.status },
    });
  } catch (error) {
    console.error("User approval error:", error);
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 });
  }
}
