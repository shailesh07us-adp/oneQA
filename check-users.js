const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log(`Found ${users.length} users.`);
  users.forEach(u => {
    console.log(`ID: ${u.id}`);
    console.log(`  Name:  "${u.name}"`);
    console.log(`  Email: "${u.email}" (Length: ${u.email.length})`);
    console.log(`  Status: ${u.status}`);
    console.log(`  Created: ${u.createdAt}`);
    console.log('---');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
