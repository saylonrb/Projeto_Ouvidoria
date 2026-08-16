const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const res = await prisma.masterTicket.findMany({
      where: {
        submissions: { _count: { gte: 2 } }
      }
    });
    console.log("Success, count:", res.length);
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
