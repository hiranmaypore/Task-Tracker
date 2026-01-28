import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ProjectRole } from '@prisma/client';

export class AddMemberDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsEnum(ProjectRole)
  role: ProjectRole;
}
