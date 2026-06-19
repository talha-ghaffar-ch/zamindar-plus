import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateIncomeDto {
  @IsOptional()
  @IsString()
  cropId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsString()
  quantityUnit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalAmount?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  incomeDate?: Date;

  @IsOptional()
  @IsInt()
  @Min(1)
  incomeMonth?: number;

  @IsOptional()
  @IsInt()
  @Min(1900)
  incomeYear?: number;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  buyerName?: string;
}
