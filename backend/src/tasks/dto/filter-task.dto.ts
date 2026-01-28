import { IsOptional, IsEnum, IsString } from 'class-validator';
import { TaskStatus, TaskPriority } from '@prisma/client';

export class FilterTaskDto {
  @IsOptional()
  @IsString()
  project_id?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsString()
  assignee_id?: string;

  @IsOptional()
  @IsString()
  search?: string; // Search in title and description
}
