import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatHistoryMessageDto {
  @IsIn(['assistant', 'user'])
  role: 'assistant' | 'user';

  @IsString()
  @MaxLength(1200)
  text: string;
}

export class ChatMessageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(1200)
  message: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryMessageDto)
  history?: ChatHistoryMessageDto[];
}
