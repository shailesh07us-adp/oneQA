import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireProjectRole, requireGlobalRole, getSessionUser } from "@/lib/rbac";

// GET — List all members for a project (Members or Admin only)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify access: Admin or existing member
  if (session.globalRole !== "ADMIN") {
    const isMember = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId: session.id, projectId: id } }
    });
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: {
      user: { select: { id: true, name: true, email: true, globalRole: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(members);
}

// POST — Add a user to project (PROJECT_LEAD or Admin only)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireProjectRole(id, "PROJECT_LEAD");
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { userId, role } = body; // role: PROJECT_LEAD or CONTRIBUTOR

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
    }

    if (role !== "PROJECT_LEAD" && role !== "CONTRIBUTOR") {
      return NextResponse.json({ error: "Invalid project role" }, { status: 400 });
    }

    const member = await prisma.projectMember.create({
      data: {
        userId,
        projectId: id,
        role
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "User is already a member of this project" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}

// PUT — Update a project member's role (PROJECT_LEAD or Admin only)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireProjectRole(id, "PROJECT_LEAD");
  if (!auth.authorized) return auth.response;

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    
    if (!userId) return NextResponse.json({ error: "userId required in query string" }, { status: 400 });
    if (userId === auth.session.id && auth.session.globalRole !== "ADMIN") {
      return NextResponse.json({ error: "Cannot modify your own project role" }, { status: 400 });
    }

    const body = await req.json();
    const { role } = body;

    if (role !== "PROJECT_LEAD" && role !== "CONTRIBUTOR") {
      return NextResponse.json({ error: "Invalid project role" }, { status: 400 });
    }

    const member = await prisma.projectMember.update({
      where: { userId_projectId: { userId, projectId: id } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } }
    });

    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update member" }, { status: 500 });
  }
}

// DELETE — Remove a member from the project (PROJECT_LEAD or Admin only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireProjectRole(id, "PROJECT_LEAD");
  if (!auth.authorized) return auth.response;

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    
    if (!userId) return NextResponse.json({ error: "userId required in query string" }, { status: 400 });
    
    // Prevent removing yourself unless you're an admin
    if (userId === auth.session.id && auth.session.globalRole !== "ADMIN") {
      return NextResponse.json({ error: "Cannot remove yourself from the project" }, { status: 400 });
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId: id } }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
