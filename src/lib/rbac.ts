import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export type GlobalRole = "ADMIN" | "USER";
export type ProjectRole = "PROJECT_LEAD" | "CONTRIBUTOR";

/**
 * Get the current user's session.
 * Returns null if not authenticated.
 */
export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    user: session.user,
    globalRole: ((session.user as any).globalRole || "USER") as GlobalRole,
    id: (session.user as any).id as string,
  };
}

/**
 * Guard an API route for Global Role (e.g. ADMIN only).
 */
export async function requireGlobalRole(role: GlobalRole) {
  const session = await getSessionUser();
  if (!session) {
    return { authorized: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  
  if (role === "ADMIN" && session.globalRole !== "ADMIN") {
    return { authorized: false as const, response: NextResponse.json({ error: "Forbidden — admin access required" }, { status: 403 }) };
  }
  
  return { authorized: true as const, session };
}

/**
 * Guard an API route for Project Role.
 * Admins implicitly have PROJECT_LEAD access to everything.
 */
export async function requireProjectRole(projectId: string, minRole: ProjectRole) {
  const session = await getSessionUser();
  if (!session) {
    return { authorized: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // Admins have implicit full access
  if (session.globalRole === "ADMIN") {
    return { authorized: true as const, session, projectRole: "PROJECT_LEAD" as ProjectRole };
  }

  // Check project membership
  const member = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: session.id,
        projectId,
      }
    }
  });

  if (!member) {
    return { authorized: false as const, response: NextResponse.json({ error: "Forbidden — not a member of this project" }, { status: 403 }) };
  }

  if (minRole === "PROJECT_LEAD" && member.role !== "PROJECT_LEAD") {
    return { authorized: false as const, response: NextResponse.json({ error: "Forbidden — project lead access required" }, { status: 403 }) };
  }

  return { authorized: true as const, session, projectRole: member.role as ProjectRole };
}
