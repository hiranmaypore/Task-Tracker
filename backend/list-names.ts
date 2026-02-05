
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const projects = await prisma.project.findMany({
    select: { name: true }
  });

  console.log(`Total projects: ${projects.length}`);
  projects.forEach((p, i) => {
    console.log(`${i+1}. "${p.name}"`);
  });

  await prisma.$disconnect();
}

main();
