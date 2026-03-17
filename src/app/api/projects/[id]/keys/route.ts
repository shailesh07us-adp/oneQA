import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "crypto";
import { requireProjectRole } from "@/lib/rbac";

// POST — Generate API key (PROJECT_LEAD only for this specific project)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireProjectRole(id, "PROJECT_LEAD");
  if (!auth.authorized) return auth.response;
  try {
    const body = await req.json();
    const label = body.label || "Default";

    const rawKey = `oqa_${crypto.randomBytes(24).toString("hex")}`;
    const prefix = rawKey.slice(0, 12);
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    await prisma.apiKey.create({
      data: { label, keyHash, prefix, projectId: id },
    });

    return NextResponse.json({ key: rawKey, prefix, label }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate API key" }, { status: 500 });
  }
}

// DELETE — Revoke API key (PROJECT_LEAD only for this specific project)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireProjectRole(id, "PROJECT_LEAD");
  if (!auth.authorized) return auth.response;
  try {
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("keyId");
    if (!keyId) return NextResponse.json({ error: "keyId required" }, { status: 400 });

    await prisma.apiKey.update({
      where: { id: keyId, projectId: id },
      data: { revoked: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to revoke" }, { status: 500 });
  }
}
