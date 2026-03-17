const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding enterprise platform...\n");

  // 1. Create users with different roles
  const adminHash = await bcrypt.hash("admin123", 12);
  const leadHash = await bcrypt.hash("lead123", 12);
  const contribHash = await bcrypt.hash("viewer123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@oneqa.dev" },
    update: {},
    create: { email: "admin@oneqa.dev", name: "Admin User", passwordHash: adminHash, globalRole: "ADMIN" },
  });

  const lead = await prisma.user.upsert({
    where: { email: "lead@oneqa.dev" },
    update: {},
    create: { email: "lead@oneqa.dev", name: "Sarah Lead", passwordHash: leadHash, globalRole: "USER" },
  });

  const contrib = await prisma.user.upsert({
    where: { email: "viewer@oneqa.dev" },
    update: {},
    create: { email: "viewer@oneqa.dev", name: "Dev Viewer", passwordHash: contribHash, globalRole: "USER" },
  });

  const viewer1 = await prisma.user.upsert({
    where: { email: "unassigned1@oneqa.dev" },
    update: {},
    create: { email: "unassigned1@oneqa.dev", name: "Alice Unassigned", passwordHash: contribHash, globalRole: "USER" },
  });

  const viewer2 = await prisma.user.upsert({
    where: { email: "unassigned2@oneqa.dev" },
    update: {},
    create: { email: "unassigned2@oneqa.dev", name: "Bob Unassigned", passwordHash: contribHash, globalRole: "USER" },
  });

  const viewer3 = await prisma.user.upsert({
    where: { email: "unassigned3@oneqa.dev" },
    update: {},
    create: { email: "unassigned3@oneqa.dev", name: "Charlie Unassigned", passwordHash: contribHash, globalRole: "USER" },
  });

  console.log("  Users created:");
  console.log("    ✓ admin@oneqa.dev / admin123    (Global: ADMIN)");
  console.log("    ✓ lead@oneqa.dev  / lead123     (Global: USER, mapped to PROJECT_LEAD)");
  console.log("    ✓ viewer@oneqa.dev / viewer123  (Global: USER, mapped to CONTRIBUTOR)");
  console.log("    ✓ unassigned*@oneqa.dev / viewer123 (Global: USER, no project memberships)\n");

  // 2. Create projects
  const projectDefs = [
    { name: "OneQA Login Module", slug: "oneqa-login", description: "Authentication and authorization tests" },
    { name: "OneQA Reports Module", slug: "oneqa-reports", description: "Report generation and export tests" },
    { name: "OneQA Admin Panel", slug: "oneqa-admin", description: "Admin panel CRUD and permissions tests" },
    { name: "OneQA API Gateway", slug: "oneqa-api", description: "API endpoint validation and rate limiting tests" },
  ];

  const projects = [];
  for (const def of projectDefs) {
    const project = await prisma.project.upsert({
      where: { slug: def.slug },
      update: {},
      create: { 
        ...def, 
        ownerId: admin.id,
        members: {
          create: [
            { userId: admin.id, role: "PROJECT_LEAD" },
            { userId: lead.id, role: "PROJECT_LEAD" },
            { userId: contrib.id, role: "CONTRIBUTOR" }
          ]
        }
      },
    });
    projects.push(project);
  }
  console.log(`  ✓ ${projects.length} projects created`);

  // 3. Create test runs linked to projects
  const envs = ["QA", "Staging", "Production", "Dev"];
  const statuses = ["passed", "passed", "passed", "passed", "passed", "passed", "failed", "passed"];
  const testNames = [
    ["Verify login with valid credentials", "Verify login with invalid credentials", "Verify password reset flow"],
    ["Generate standard report", "Validate report export to PDF", "Check report scheduling"],
    ["Create new user", "Edit user permissions", "Delete user account"],
    ["Health check endpoint", "Authentication token validation", "Rate limiting verification"],
  ];

  // Clear existing test data
  await prisma.testCase.deleteMany({});
  await prisma.testSuite.deleteMany({});
  await prisma.testRun.deleteMany({});

  for (let i = 0; i < 20; i++) {
    const project = projects[i % projects.length];
    const env = envs[i % envs.length];
    const status = statuses[i % statuses.length];
    const startTime = new Date(Date.now() - i * 3600000 * 3);
    const duration = Math.floor(Math.random() * 30000) + 5000;
    const suiteTests = testNames[i % testNames.length];

    await prisma.testRun.create({
      data: {
        project: project.name,
        projectId: project.id,
        env,
        startTime,
        endTime: new Date(startTime.getTime() + duration),
        status,
        duration,
        suites: {
          create: [{
            title: `${project.name} - Suite`,
            tests: {
              create: suiteTests.map((title) => ({
                title,
                status: status === "failed" && Math.random() > 0.5 ? "failed" : "passed",
                duration: Math.floor(Math.random() * 5000) + 500,
                retries: Math.random() > 0.8 ? 1 : 0,
              })),
            },
          }],
        },
      },
    });
  }
  console.log("  ✓ 20 test runs seeded across 4 projects\n");
  console.log("Done! Start the app with: npm run dev");
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
