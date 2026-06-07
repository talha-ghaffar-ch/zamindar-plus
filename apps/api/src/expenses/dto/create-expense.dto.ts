import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  cropId: string;

  @IsString()
  expenseCategory: string;

  @IsString()
  @MinLength(2)
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @Type(() => Date)
  @IsDate()
  expenseDate: Date;

  @IsInt()
  @Min(1)
  expenseMonth: number;

  @IsInt()
  @Min(1900)
  expenseYear: number;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  receiptImageUrl?: string;

  @IsOptional()
  @IsString()
  sharedGroupId?: string;
}
