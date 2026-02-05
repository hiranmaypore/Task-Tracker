
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { tasks: true } },
      tasks: { select: { id: true } }
    }
  });

  console.log('--- Project Task Summary ---');
  projects.forEach(p => {
    if (p.tasks.length > 0 || (p._count?.tasks || 0) > 0) {
      console.log(`Project: "${p.name}" | ID: ${p.id} | p.tasks.length: ${p.tasks.length} | _count: ${p._count?.tasks}`);
    }
  });
  
  const orphans = await prisma.task.count({ where: { project_id: { notIn: projects.map(p => p.id) } } });
  console.log(`--- Total tasks: ${await prisma.task.count()} ---`);
  console.log(`--- Orphaned tasks (no valid project_id): ${orphans} ---`);

  await prisma.$disconnect();
}

main();
