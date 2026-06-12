import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  farmerType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250000)
  profileImageUrl?: string;

  @IsOptional()
  @IsIn(['Acre', 'Kanal', 'Marla'])
  preferredAreaUnit?: string;

  @IsOptional()
  @IsIn(['PKR', 'USD', 'SAR', 'AED'])
  preferredCurrency?: string;

  @IsOptional()
  @IsIn(['English', 'Urdu', 'Punjabi'])
  preferredLanguage?: string;

  @IsOptional()
  @IsIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
  dateFormat?: string;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  smsNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyReport?: boolean;
}
