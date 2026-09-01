import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateGitAccessTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}