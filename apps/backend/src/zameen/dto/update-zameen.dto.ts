import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateZameenDto {
  @IsOptional()
  @IsString()
  profileId?: string;

  @IsOptional()
  @IsString()
  murabbaNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  zameenName?: string;

  @IsOptional()
  @IsString()
  killaNumber?: string;

  @IsOptional()
  @IsString()
  khasraNumber?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  totalAreaValue?: number;

  @IsOptional()
  @IsString()
  totalAreaUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  totalAreaSqft?: number;

  @IsOptional()
  @IsString()
  ownershipType?: string;
}
