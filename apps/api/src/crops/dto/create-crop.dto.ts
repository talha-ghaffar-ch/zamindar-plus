import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCropDto {
  @IsString()
  zameenId: string;

  @IsString()
  @MinLength(2)
  cropName: string;

  @IsNumber()
  @Min(0.01)
  cropAreaValue: number;

  @IsString()
  cropAreaUnit: string;

  @IsNumber()
  @Min(1)
  cropAreaSqft: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  startMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  startYear?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  expectedEndMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  expectedEndYear?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
