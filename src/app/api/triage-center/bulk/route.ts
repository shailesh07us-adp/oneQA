import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getFingerprint } from '@/lib/intelligence';

export async function POST(req: Request) {
  try {
    const { testIds, status, comment, fingerprint, error, project } = await req.json();

    if (!testIds || !Array.isArray(testIds)) {
      return NextResponse.json({ error: 'testIds must be an array' }, { status: 400 });
    }
    
    if (!project) {
      return NextResponse.json({ error: 'project is required' }, { status: 400 });
    }

    // Update statuses for this specific instance
    await prisma.testCase.updateMany({
      where: { id: { in: testIds } },
      data: { status }
    });

    // Expert Feature: Save to Knowledge Base
    if (fingerprint || error) {
      const activeFingerprint = fingerprint || getFingerprint(error);
      await prisma.failurePattern.upsert({
        where: { fingerprint_project: { fingerprint: activeFingerprint, project } },
        update: {
          resolvedStatus: status,
          lastSeen: new Date(),
          occurrenceCount: { increment: 1 }
        },
        create: {
          fingerprint: activeFingerprint,
          project,
          resolvedStatus: status,
          comment: comment || 'Automated triage learning'
        }
      });
    }

    return NextResponse.json({ success: true, count: testIds.length });
  } catch (error) {
    console.error('Error in bulk triage:', error);
    return NextResponse.json({ error: 'Failed to perform bulk triage' }, { status: 500 });
  }
}
