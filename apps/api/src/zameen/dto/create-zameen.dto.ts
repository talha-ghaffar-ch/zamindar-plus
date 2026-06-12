import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateZameenDto {
  @IsString()
  profileId: string;

  @IsOptional()
  @IsString()
  murabbaNumber?: string;

  @IsString()
  @MinLength(2)
  zameenName: string;

  @IsOptional()
  @IsString()
  killaNumber?: string;

  @IsOptional()
  @IsString()
  khasraNumber?: string;

  @IsNumber()
  @Min(0.01)
  totalAreaValue: number;

  @IsString()
  totalAreaUnit: string;

  @IsNumber()
  @Min(1)
  totalAreaSqft: number;

  @IsOptional()
  @IsString()
  ownershipType?: string;
}
