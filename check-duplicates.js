const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allUsers = await prisma.user.findMany();
  const emailCounts = {};
  allUsers.forEach(u => {
    const email = u.email;
    emailCounts[email] = (emailCounts[email] || 0) + 1;
  });
  
  const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1);
  console.log('Duplicate emails (exact match):', duplicates);
  
  const caseInsensitiveCounts = {};
  allUsers.forEach(u => {
    const email = u.email.toLowerCase();
    caseInsensitiveCounts[email] = (caseInsensitiveCounts[email] || 0) + 1;
  });
  const ciDuplicates = Object.entries(caseInsensitiveCounts).filter(([email, count]) => count > 1);
  console.log('Duplicate emails (case-insensitive):', ciDuplicates);

  console.log('Total users:', allUsers.length);
  
  allUsers.forEach(u => {
    console.log(`ID: ${u.id}, Email: [${u.email}], Status: ${u.status}, CreatedAt: ${u.createdAt}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
