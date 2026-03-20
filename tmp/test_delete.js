const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("Please provide a user ID");
    process.exit(1);
  }

  console.log(`Diagnostic: Attempting to delete user ${userId}`);
  
  try {
    console.log("Diagnostic: Checking user existence...");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.log("Diagnostic: User not found");
      return;
    }
    console.log(`Diagnostic: Found user ${user.email}. Role: ${user.globalRole}`);

    console.log("Diagnostic: Checking project ownership...");
    const ownedProjects = await prisma.project.findMany({ where: { ownerId: userId } });
    console.log(`Diagnostic: User owns ${ownedProjects.length} projects`);

    console.log("Diagnostic: Checking project memberships...");
    const memberships = await prisma.projectMember.findMany({ where: { userId: userId } });
    console.log(`Diagnostic: User has ${memberships.length} memberships`);

    console.log("Diagnostic: Executing delete...");
    const start = Date.now();
    const deleted = await prisma.user.delete({ where: { id: userId } });
    const duration = Date.now() - start;
    console.log(`Diagnostic: Delete successful in ${duration}ms`);
  } catch (error) {
    console.error("Diagnostic: ERROR during delete:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
