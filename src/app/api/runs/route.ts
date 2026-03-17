import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const env = searchParams.get('env') || 'all';
    const sortBy = searchParams.get('sortBy') || 'startTime';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};

    if (search) {
      where.project = { contains: search };
    }
    if (status !== 'all') {
      where.status = status;
    }
    if (env !== 'all') {
      where.env = env;
    }

    const orderBy: any = {};
    if (['startTime', 'duration', 'project', 'env', 'status'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.startTime = 'desc';
    }

    const [runs, total] = await Promise.all([
      prisma.testRun.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          suites: {
            include: {
              tests: true,
            },
          },
        },
      }),
      prisma.testRun.count({ where }),
    ]);

    // Get all distinct environments for filter dropdown
    const allRuns = await prisma.testRun.findMany({ select: { env: true }, distinct: ['env'] });
    const environments = allRuns.map((r: any) => r.env);

    return NextResponse.json({
      runs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      environments,
    });
  } catch (error) {
    console.error('Error fetching runs:', error);
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
  }
}
