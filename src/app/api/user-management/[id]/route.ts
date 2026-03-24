import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

// PUT /api/user-management/[id] — Update user role (ADMIN only)
// (Keeping this standard for now as it doesn't hang)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "oneqa-enterprise-secret-change-in-production" });
  if (!token || token.globalRole !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { name, role } = body;

  const validRoles = ["ADMIN", "USER"];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Prevent demoting yourself
  if (id === token.id && role && role !== "ADMIN") {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const data: Prisma.UserUpdateInput = {};
  if (name !== undefined) data.name = name;
  if (role) data.globalRole = role;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, globalRole: true },
  });

  return NextResponse.json(user);
}

// DELETE /api/user-management/[id] — Delete user (ADMIN only)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET || "oneqa-enterprise-secret-change-in-production" });

    if (!token || token.globalRole !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (id === token.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Using Prisma's native delete which is highly optimized for SQLite 
    // and automatically handles cascading as defined in the schema.
    await prisma.user.delete({
      where: { id }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
