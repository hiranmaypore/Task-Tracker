import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  googleAccessToken?: string;

  @IsOptional()
  @IsString()
  googleRefreshToken?: string;

  @IsOptional()
  calendarSyncEnabled?: boolean;
}
