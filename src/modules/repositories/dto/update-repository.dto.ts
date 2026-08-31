import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

import { RepositoryVisibilityDto } from './create-repository.dto';

export class UpdateRepositoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RepositoryVisibilityDto)
  @IsOptional()
  visibility?: RepositoryVisibilityDto;
}
