
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const projects = await prisma.project.findMany({
    include: {
      _count: true,
      tasks: { select: { id: true } },
      members: { select: { id: true } }
    }
  });

  console.log(`Total Projects in DB: ${projects.length}`);
  projects.forEach(p => {
    console.log(`- ${p.name} (id: ${p.id}): _count.tasks=${p._count?.tasks}, p.tasks.length=${p.tasks.length}`);
  });

  const allTasks = await prisma.task.findMany({ select: { id: true, project_id: true } });
  console.log(`Total Tasks in DB: ${allTasks.length}`);
  
  await prisma.$disconnect();
}

main();
