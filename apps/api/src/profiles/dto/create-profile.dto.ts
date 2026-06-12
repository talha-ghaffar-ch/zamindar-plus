import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @MinLength(2)
  profileName: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  chakAreaName?: string;

  @IsOptional()
  @IsString()
  villageName?: string;
}
