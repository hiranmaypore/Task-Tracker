
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const projectId = "6980fcbb77b03551cc90470a";
  const tasksCount = await prisma.task.count({ where: { project_id: projectId } });
  const tasks = await prisma.task.findMany({ where: { project_id: projectId }, select: { id: true, title: true } });

  console.log(`Project ID: ${projectId}`);
  console.log(`Direct count: ${tasksCount}`);
  console.log(`Tasks: ${JSON.stringify(tasks)}`);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { tasks: { select: { id: true } } }
  });
  console.log(`Include count: ${project?.tasks.length}`);

  await prisma.$disconnect();
}

main();
