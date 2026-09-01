import { IsEnum } from 'class-validator';

import { RepositoryMemberRole } from './create-repository-member.dto';

export class UpdateRepositoryMemberDto {
  @IsEnum(RepositoryMemberRole)
  role: RepositoryMemberRole;
}