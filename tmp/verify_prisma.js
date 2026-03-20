const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Checking User table fields...");
    const users = await prisma.user.findMany({ take: 1 });
    console.log("Found users sample:", JSON.stringify(users, null, 2));

    // Create a mock user for testing
    const testEmail = `test_${Date.now()}@example.com`;
    console.log(`Creating test user with email: ${testEmail}`);
    const user1 = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Test User 1",
        passwordHash: "dummy",
        status: "PENDING"
      }
    });
    console.log("Created user 1:", user1.id);

    // Create another user with same email
    // This will fail if uniqueness is enforced on all records
    // Let's see if we can create it
    try {
      const user2 = await prisma.user.create({
        data: {
          email: testEmail.toUpperCase(), // Case variation
          name: "Test User 2",
          passwordHash: "dummy",
          status: "PENDING"
        }
      });
      console.log("Created user 2 with upper case email:", user2.id);
    } catch (e) {
      console.log("Failed to create user 2 with upper case email (expected if unique constraint is case-insensitive):", e.message);
    }

    // Cleanup
    await prisma.user.delete({ where: { id: user1.id } });
    console.log("Cleaned up.");
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
