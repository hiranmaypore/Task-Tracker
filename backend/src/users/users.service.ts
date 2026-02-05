
import { Injectable, ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createUserDto.email }
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(createUserDto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        password_hash: passwordHash,
        role: createUserDto.role || 'USER',
      },
    });

    const { password_hash, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data: any = { ...updateUserDto };
    
    if (data.password) {
        // SECURITY: If changing password, validation should be done ideally.
        // For now, we assume controller/guard handles auth.
        const salt = await bcrypt.genSalt();
        data.password_hash = await bcrypt.hash(data.password, salt);
        delete data.password;
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
      select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true, // Ensure we return this
          created_at: true,
      }
    });

    // Log this action
    await this.prisma.activityLog.create({
        data: {
            user_id: id,
            action: 'updated profile',
            entity_type: 'User',
            entity_id: id,
        }
    });
    
    // Check for "Profile Updated" automation trigger (simplified)
    // In a real app, this would be more robust.
    
    return user;
  }

  async getUserStats(userId: string) {
    const [projectsOwned, tasksCreated, tasksCompleted, totalTasks] = await Promise.all([
      this.prisma.project.count({ where: { owner_id: userId } }),
      this.prisma.task.count({ where: { assignee_id: userId } }),
      this.prisma.task.count({ where: { assignee_id: userId, status: 'DONE' } }),
      this.prisma.task.count({ where: { assignee_id: userId } }),
    ]);

    const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      select: { created_at: true }
    });

    return {
      projectsOwned,
      tasksCreated,
      tasksCompleted,
      completionRate,
      memberSince: user?.created_at || new Date(),
    };
  }

  async remove(id: string) {
    // Delete user and all related data (cascade handled by Prisma schema)
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Account deleted successfully' };
  }
}
