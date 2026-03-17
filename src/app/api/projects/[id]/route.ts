import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireProjectRole, getSessionUser } from "@/lib/rbac";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: { select: { testRuns: true } },
        apiKeys: { where: { revoked: false } },
        testRuns: { orderBy: { startTime: "desc" }, take: 10 },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          }
        }
      },
    });

    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Enforce visibility: only admins or members can view
    if (session.globalRole !== "ADMIN" && !project.members.some(m => m.userId === session.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch project details" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireProjectRole(id, "PROJECT_LEAD");
    if (!auth.authorized) return auth.response;

    const body = await req.json();
    const { name, description } = body;

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const auth = await requireProjectRole(id, "PROJECT_LEAD");
    if (!auth.authorized) return auth.response;

    const project = await prisma.project.update({
      where: { id },
      data: { archived: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to archive project" }, { status: 500 });
  }
}
