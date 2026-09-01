import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export enum RepositoryMemberRole {
  READ = 'READ',
  WRITE = 'WRITE',
  ADMIN = 'ADMIN',
}

export class CreateRepositoryMemberDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  username: string;

  @IsEnum(RepositoryMemberRole)
  role: RepositoryMemberRole;
}