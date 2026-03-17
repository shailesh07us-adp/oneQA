const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

async function seedFailures() {
  console.log('Seeding failures...');
  
  const project = await prisma.project.findFirst() || await prisma.project.create({
    data: { name: 'OneQA Admin Panel', slug: 'oneqa-admin' }
  });

  const failurePatterns = [
    {
      error: 'Error: Database connection timeout after 5000ms',
      stack: 'Error: Database connection timeout\n    at Connection.connect (node_modules/db-driver/lib/connection.js:45:12)\n    at Pool.getConnection (node_modules/db-driver/lib/pool.js:89:10)',
      count: 3,
      title_suffix: ['Login Flow', 'User Sync', 'API Health']
    },
    {
      error: 'AssertionError: expected "Login" to equal "Dashboard"',
      stack: 'AssertionError: expected "Login" to equal "Dashboard"\n    at Object.callback (tests/auth.spec.ts:12:34)\n    at Runner.runTest (node_modules/test-runner/lib/runner.js:102:11)',
      count: 2,
      title_suffix: ['Auth Redirect', 'Session Refresh']
    }
  ];

  for (const pattern of failurePatterns) {
    const run = await prisma.testRun.create({
      data: {
        project: project.name,
        projectId: project.id,
        env: Math.random() > 0.5 ? 'PRODUCTION' : 'STAGING',
        status: 'failed',
        startTime: new Date(),
        duration: 5000 + Math.floor(Math.random() * 5000),
        suites: {
          create: [{
            title: 'Automated Regression Suite',
            tests: {
              create: Array.from({ length: pattern.count }).map((_, i) => ({
                title: `Critical Path: ${pattern.title_suffix[i]}`,
                status: 'failed',
                error: pattern.error,
                stack: pattern.stack,
                duration: 1000 + Math.floor(Math.random() * 2000)
              }))
            }
          }]
        }
      }
    });
    console.log(`Created failed run ${run.id} with ${pattern.count} failures`);
  }

  console.log('Seed completed successfully!');
}

seedFailures().catch(console.error).finally(() => prisma.$disconnect());
