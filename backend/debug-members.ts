
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const projectId = "6980fcbb77b03551cc90470a";
  const members = await prisma.projectMember.findMany({
    where: { project_id: projectId },
    include: { user: { select: { id: true, name: true, email: true } } }
  });

  console.log(`Project: Final Year Project (${projectId})`);
  console.log(`Members: ${JSON.stringify(members)}`);

  await prisma.$disconnect();
}

main();
