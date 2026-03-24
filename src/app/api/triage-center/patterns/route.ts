import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const patterns = await prisma.failurePattern.findMany({
      orderBy: { lastSeen: 'desc' }
    });
    return NextResponse.json({ patterns });
  } catch (error) {
    console.error('Error fetching failure patterns:', error);
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 });
  }
}
