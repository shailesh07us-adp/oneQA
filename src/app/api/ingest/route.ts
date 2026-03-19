import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
          create: suites.map((suite: any) => ({
            title: suite.title,
            tests: {
              create: suite.tests.map((test: any) => ({
                title: test.title,
                status: test.status,
                duration: test.duration,
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
