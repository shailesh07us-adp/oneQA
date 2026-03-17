const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const runCount = await prisma.testRun.count();
  const failedRunCount = await prisma.testRun.count({ where: { status: 'failed' } });
  const testCount = await prisma.testCase.count();
  const failedTestCount = await prisma.testCase.count({ where: { status: 'failed' } });

  console.log({
    runCount,
    failedRunCount,
    testCount,
    failedTestCount
  });

  const sampleFailedRun = await prisma.testRun.findFirst({
    where: { status: 'failed' },
    include: { suites: { include: { tests: true } } }
  });

  console.log('Sample Failed Run:', JSON.stringify(sampleFailedRun, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
