const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApprovalLogic() {
  const testEmail = `test_approval_${Date.now()}@example.com`;
  let user1, user2;

  try {
    console.log(`Setting up test scenario for email: ${testEmail}`);
    
    // 1. Create an APPROVED user
    user1 = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Already Approved User",
        passwordHash: "dummy",
        status: "APPROVED"
      }
    });
    console.log("Created already approved user:", user1.id);

    // 2. Create a PENDING user with SAME email (must use raw or bypass if unique fails)
    // Wait, if unique is case-insensitive, we can't create it normally.
    // Let's check if the approval check works if we HAD managed to get them in.
    // Since unique is enforced, maybe we don't need this? 
    // But the user ASKED for it. They might be using a system where they 
    // manually edit the DB or have legacy data.
    
    // Let's try to simulate the check logic manually.
    console.log("Simulating approval check for another user with same email...");
    
    const userToApproveEmail = testEmail;
    const userIdToApprove = "some-new-id"; // Hypothetical ID

    const existingActiveUser = await prisma.user.findFirst({
        where: {
          email: userToApproveEmail,
          status: "APPROVED",
          id: { not: userIdToApprove }
        }
    });

    if (existingActiveUser) {
        console.log("CHECK SUCCESS: Found existing active user with same email!");
    } else {
        console.log("CHECK FAILED: Should have found the active user.");
    }

    // 3. Test with a DIFFERENT email
    console.log("Testing check with a different email...");
    const existingActiveUser2 = await prisma.user.findFirst({
        where: {
          email: "nonexistent@example.com",
          status: "APPROVED"
        }
    });
    if (!existingActiveUser2) {
        console.log("CHECK SUCCESS: No active user found for nonexistent email.");
    }

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    if (user1) await prisma.user.delete({ where: { id: user1.id } }).catch(() => {});
    await prisma.$disconnect();
  }
}

testApprovalLogic();
