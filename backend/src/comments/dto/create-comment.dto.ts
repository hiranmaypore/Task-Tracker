import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  task_id: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
