const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function setupDb() {
  console.log("Setting up database...");
  try {
    await prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL;");
    console.log("WAL mode enabled.");
    await prisma.$executeRawUnsafe("PRAGMA busy_timeout=30000;");
    console.log("Busy timeout set to 30000ms.");
  } catch (error) {
    console.error("Error setting PRAGMAs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDb();
