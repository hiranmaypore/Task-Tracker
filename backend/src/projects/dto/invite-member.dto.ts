
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';

export class InviteMemberDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsEnum(['OWNER', 'EDITOR', 'VIEWER'])
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
}
