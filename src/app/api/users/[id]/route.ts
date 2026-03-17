import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireGlobalRole } from "@/lib/rbac";

// PUT /api/users/[id] — Update user role (ADMIN only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireGlobalRole("ADMIN");
  if (!auth.authorized) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const { name, role } = body;

  const validRoles = ["ADMIN", "USER"];
  if (role && !validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Prevent demoting yourself
  if (id === auth.session.id && role && role !== "ADMIN") {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const data: any = {};
  if (name !== undefined) data.name = name;
  if (role) data.globalRole = role;

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, globalRole: true },
  });

  return NextResponse.json(user);
}

// DELETE /api/users/[id] — Delete user (ADMIN only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireGlobalRole("ADMIN");
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  // Prevent deleting yourself
  if (id === auth.session.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
