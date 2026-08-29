import { PartialType } from '@nestjs/mapped-types';
import { IsInt, IsOptional } from 'class-validator';

import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsInt()
  userId?: number;
}