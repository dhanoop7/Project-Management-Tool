import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export enum RepositoryVisibilityDto {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export class CreateRepositoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/)
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(RepositoryVisibilityDto)
  @IsOptional()
  visibility?: RepositoryVisibilityDto;
}
