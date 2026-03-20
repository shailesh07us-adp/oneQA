const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const emailBase = 'test-fix-' + Date.now();
  const email1 = emailBase + '@Example.Com'; // Mixed case
  const email2 = emailBase.toUpperCase() + '@example.com'; // Different mixed case

  console.log(`Testing with emails: [${email1}] and [${email2}]`);

  // 1. Test Registration with normalization
  try {
    // We can't easily call the API route directly here without a full server,
    // so we'll simulate the logic that we added to the route.
    
    const normalize = (e) => e.toLowerCase().trim();
    
    const n1 = normalize(email1);
    const n2 = normalize(email2);
    
    console.log(`Normalized 1: ${n1}`);
    console.log(`Normalized 2: ${n2}`);

    if (n1 !== n2) {
      throw new Error("Normalization failed! n1 should equal n2");
    }

    // Simulate first registration
    await prisma.user.create({
      data: {
        name: 'Fixed Test 1',
        email: n1,
        passwordHash: 'hash',
        status: 'PENDING'
      }
    });
    console.log('Simulation: First user created with normalized email.');

    // Simulate second registration with same normalized email
    try {
      await prisma.user.create({
        data: {
          name: 'Fixed Test 2',
          email: n2,
          passwordHash: 'hash',
          status: 'PENDING'
        }
      });
      console.log('ERROR: Simulation allowed duplicate normalized email!');
    } catch (e) {
      console.log('SUCCESS: Simulation correctly rejected duplicate normalized email.');
    }

  } catch (e) {
    console.error('Test failed:', e);
  } finally {
    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { contains: emailBase.toLowerCase() } }
    });
  }

  // 2. Check existing users - are any still PENDING that should be APPROVED?
  const pendingUsers = await prisma.user.findMany({ where: { status: 'PENDING' } });
  console.log(`Currently there are ${pendingUsers.length} pending users.`);
  pendingUsers.forEach(u => {
    console.log(`  Pending: ${u.email} (${u.name})`);
  });
}

test().catch(console.error).finally(() => prisma.$disconnect());
