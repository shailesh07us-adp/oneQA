const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const email = 'test-unique-' + Date.now() + '@example.com';
  console.log(`Testing with email: ${email}`);

  // 1. Create first
  try {
    const u1 = await prisma.user.create({
      data: {
        name: 'Test 1',
        email: email,
        passwordHash: 'hash',
        status: 'PENDING'
      }
    });
    console.log('Created first successfully.');
  } catch (e) {
    console.log('Error creating first:', e.code, e.message);
  }

  // 2. Try to create second (exact same email)
  try {
    await prisma.user.create({
      data: {
        name: 'Test 2',
        email: email,
        passwordHash: 'hash',
        status: 'PENDING'
      }
    });
    console.log('ERROR: Created second with exact same email successfully!');
  } catch (e) {
    console.log('SUCCESS: Caught expected unique constraint error for exact same email.');
  }

  // 3. Try to create third (case difference)
  const ucEmail = email.toUpperCase();
  try {
    await prisma.user.create({
      data: {
        name: 'Test 3',
        email: ucEmail,
        passwordHash: 'hash',
        status: 'PENDING'
      }
    });
    console.log('WARNING: Created third with CASE-DIFFERENT email successfully. SQLite/Prisma is case-sensitive.');
  } catch (e) {
    console.log('INFO: Caught unique constraint error for case-different email. SQLite/Prisma is case-insensitive.');
  }

  // Cleanup
  await prisma.user.deleteMany({ where: { email: { in: [email, ucEmail] } } });
}

test().catch(console.error).finally(() => prisma.$disconnect());
