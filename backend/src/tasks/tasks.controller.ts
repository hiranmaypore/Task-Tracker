import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { ProjectRoleGuard } from '../auth/guards/project-role.guard';
import { TaskRoleGuard } from '../auth/guards/task-role.guard';
import { ProjectRoles } from '../auth/decorators/project-roles.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(ProjectRoleGuard) // Only OWNER/EDITOR can create tasks
  @ProjectRoles('OWNER', 'EDITOR')
  create(@Body() createTaskDto: CreateTaskDto, @User() user: any) {
    return this.tasksService.create(createTaskDto, user.userId);
  }

  @Get()
  findAll(@User() user: any, @Query() filterDto: FilterTaskDto) {
    return this.tasksService.findAll(user.userId, filterDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(TaskRoleGuard) // Only OWNER/EDITOR can update tasks
  @ProjectRoles('OWNER', 'EDITOR')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @User() user: any) {
    return this.tasksService.update(id, updateTaskDto, user.userId);
  }

  @Delete(':id')
  @UseGuards(TaskRoleGuard) // Only OWNER/EDITOR can delete tasks
  @ProjectRoles('OWNER', 'EDITOR')
  remove(@Param('id') id: string, @User() user: any) {
    return this.tasksService.remove(id, user.userId);
  }
}
