import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionUser } from "@/lib/rbac";

// GET — List projects (Admins see all, Users see joined projects)
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const whereClause: any = { archived: false };
    if (sessionUser.globalRole !== "ADMIN") {
      whereClause.members = { some: { userId: sessionUser.id } };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        members: { select: { userId: true, role: true } },
        _count: { select: { testRuns: true, apiKeys: true } },
        testRuns: { orderBy: { startTime: "desc" }, take: 1, select: { startTime: true, status: true } },
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST — Any authenticated user can create a project and becomes PROJECT_LEAD
export async function POST(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, slug, description } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 });
    }

    const existing = await prisma.project.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "A project with this slug already exists" }, { status: 409 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        slug,
        description: description || null,
        ownerId: sessionUser.id,
        members: {
          create: {
            userId: sessionUser.id,
            role: "PROJECT_LEAD",
          }
        }
      },
      include: {
        members: { select: { role: true } },
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
