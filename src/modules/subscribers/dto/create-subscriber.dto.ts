import { IsInt } from 'class-validator';

export class CreateSubscriberDto {
  @IsInt()
  userId: number;
}