import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAllByProject(projectId: string) {
    return this.prisma.tag.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  async create(projectId: string, name: string, color?: string) {
    return this.prisma.tag.create({
      data: {
        projectId,
        name,
        color: color || '#3b82f6',
      },
    });
  }

  async addTagToTask(taskId: string, tagId: string) {
    return this.prisma.taskTag.create({
      data: { taskId, tagId },
    });
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    return this.prisma.taskTag.deleteMany({
      where: { taskId, tagId },
    });
  }

  async delete(id: string) {
    return this.prisma.tag.delete({ where: { id } });
  }
}
