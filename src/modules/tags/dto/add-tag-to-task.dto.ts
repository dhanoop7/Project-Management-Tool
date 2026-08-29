import { IsInt } from 'class-validator';

export class AddTagToTaskDto {
  @IsInt()
  tagId: number;
}