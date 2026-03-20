import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

interface IngestTest {
  title: string;
  status: string;
  duration?: number;
  error?: string;
  stack?: string;
  project?: string;
  screenshotPath?: string;
  tracePath?: string;
}

interface IngestSuite {
  title: string;
  tests: IngestTest[];
}

interface IngestBody {
  project: string;
  env: string;
  startTime: string;
  duration: number;
  status: string;
  suites: IngestSuite[];
}

export async function POST(req: Request) {
  try {
    const body: IngestBody = await req.json();
    const { project, env, startTime, duration, status, suites } = body;

    // The suites array comes from the Playwright reporter
    // Format expected:
    // {
    //   project: "Chromium",
    //   env: "local",
    //   startTime: "2023-11-20T...",
    //   duration: 1542,
    //   status: "passed",
    //   suites: [
    //     {
    //       title: "test-file.spec.ts",
    //       tests: [ { title: "Login works", status: "passed", duration: 120 } ]
    //     }
    //   ]
    // }

    const testRun = await prisma.testRun.create({
      data: {
        project: project || 'Default',
        env: env || 'QA',
        startTime: new Date(startTime),
        endTime: new Date(new Date(startTime).getTime() + (duration || 0)),
        status: status || 'passed',
        duration: duration || 0,
        suites: {
          create: suites.map((suite: IngestSuite) => ({
            title: suite.title,
            tests: {
              create: suite.tests.map((test: IngestTest) => ({
                title: test.title,
                status: test.status,
                duration: test.duration || 0,
                error: test.error || null,
                stack: test.stack || null,
                project: test.project || null,
                screenshotPath: test.screenshotPath || null,
                tracePath: test.tracePath || null,
              })),
            },
          })),
        },
      },
      include: {
        suites: {
          include: {
            tests: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, runId: testRun.id });
  } catch (error) {
    console.error('Error ingesting test run:', error);
    return NextResponse.json({ success: false, error: 'Failed to ingest data' }, { status: 500 });
  }
}
