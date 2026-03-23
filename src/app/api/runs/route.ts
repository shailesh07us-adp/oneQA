import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const env = searchParams.get('env') || 'all';
    const project = searchParams.get('project') || 'all';
    const sortBy = searchParams.get('sortBy') || 'startTime';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const runId = searchParams.get('runId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: Prisma.TestRunWhereInput = {};

    if (runId) {
      where.id = runId;
    }

    if (search) {
      where.project = { contains: search };
    }
    if (status !== 'all') {
      where.status = status;
    }
    if (env !== 'all') {
      where.env = env;
    }
    if (project !== 'all') {
      where.project = project;
    }

    const orderBy: Prisma.TestRunOrderByWithRelationInput = {};
    if (['startTime', 'duration', 'project', 'env', 'status'].includes(sortBy)) {
      (orderBy as Record<string, string>)[sortBy] = sortOrder;
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
    const environments = allRuns.map((r: { env: string }) => r.env).filter(Boolean);

    // Get all distinct projects for filter dropdown
    const allProjects = await prisma.testRun.findMany({ select: { project: true }, distinct: ['project'] });
    const projects = allProjects.map((r: { project: string }) => r.project).filter(Boolean);

    return NextResponse.json({
      runs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      environments,
      projects,
    });
  } catch (error) {
    console.error('Error fetching runs:', error);
    return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
  }
}
