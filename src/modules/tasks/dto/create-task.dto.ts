import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum([
    'UNBREAK_NOW',
    'NEEDS_TRIAGE',
    'HIGH',
    'NORMAL',
    'LOW',
    'WISHLIST',
  ])
  priority?:
    | 'UNBREAK_NOW'
    | 'NEEDS_TRIAGE'
    | 'HIGH'
    | 'NORMAL'
    | 'LOW'
    | 'WISHLIST';

  @IsOptional()
  @IsEnum([
    'OPEN',
    'RESOLVED',
    'WONT_FIX',
    'INVALID',
    'SPITE',
  ])
  status?:
    | 'OPEN'
    | 'RESOLVED'
    | 'WONT_FIX'
    | 'INVALID'
    | 'SPITE';

  @IsOptional()
  @IsEnum([
    'ALL_USERS',
    'CUSTOM',
  ])
  visibility?:
    | 'ALL_USERS'
    | 'CUSTOM';

  @IsOptional()
  @IsInt()
  assignedToId?: number;

  @IsOptional()
  @IsInt()
  parentTaskId?: number;
}