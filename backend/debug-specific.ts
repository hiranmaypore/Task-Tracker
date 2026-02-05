
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const names = ["FINAL YEAR PROJECT", "FDSDS", "DEDFEWF"];
  const projects = await prisma.project.findMany({
    where: { name: { in: names } },
    include: { tasks: { select: { id: true } } }
  });

  console.log(`Found ${projects.length} matching projects.`);
  projects.forEach(p => {
    console.log(`- "${p.name}" (ID: ${p.id}): Tasks Found: ${p.tasks.length}`);
  });

  await prisma.$disconnect();
}

main();
