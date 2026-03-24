import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { requireGlobalRole, getSessionUser } from "@/lib/rbac";
import { Prisma } from "@prisma/client";

// GET /api/user-management — List all users (Any authenticated user can list to add members)
export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      globalRole: true,
      status: true,
      createdAt: true,
      memberships: {
        select: {
          role: true,
          project: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(users);
}

// POST /api/users — Create a new user (ADMIN only)
export async function POST(req: NextRequest) {
  // Only admins can create users
  const authResponse = await requireGlobalRole("ADMIN");
  if (authResponse?.response) return authResponse.response;

  try {
    const { name, email, password, role, projectId, projectRole } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and global role are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const validRoles = ["ADMIN", "USER"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: `Invalid role. Must be one of: ${validRoles.join(", ")}` }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Wrap in a transaction if we need to also assign a project
    const newUser = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash: hashedPassword, 
          globalRole: role,
          status: "APPROVED", // Admin-added users are approved by default
        },
        select: {
          id: true,
          email: true,
          name: true,
          globalRole: true,
          createdAt: true,
        },
      });

      if (projectId && projectRole) {
        // Verify project exists
        const project = await tx.project.findUnique({ where: { id: projectId } });
        if (project) {
          await tx.projectMember.create({
            data: {
              userId: user.id,
              projectId: projectId,
              role: projectRole,
            }
          });
        }
      }

      return user;
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
