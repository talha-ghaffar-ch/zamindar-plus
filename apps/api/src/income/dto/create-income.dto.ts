import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateIncomeDto {
  @IsString()
  cropId: string;

  @IsString()
  incomeType: string;

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

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @Type(() => Date)
  @IsDate()
  incomeDate: Date;

  @IsInt()
  @Min(1)
  incomeMonth: number;

  @IsInt()
  @Min(1900)
  incomeYear: number;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  buyerName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
