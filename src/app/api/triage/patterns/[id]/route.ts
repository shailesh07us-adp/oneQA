import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.failurePattern.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting failure pattern:', error);
    return NextResponse.json({ error: 'Failed to delete pattern' }, { status: 500 });
  }
}
