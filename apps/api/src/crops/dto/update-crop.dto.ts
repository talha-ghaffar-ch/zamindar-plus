import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateCropDto {
  @IsOptional()
  @IsString()
  zameenId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  cropName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  cropAreaValue?: number;

  @IsOptional()
  @IsString()
  cropAreaUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  cropAreaSqft?: number;

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
}
