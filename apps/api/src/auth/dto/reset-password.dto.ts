import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  token: string;

  @IsString()
  @MinLength(8)
  password: string;
}
