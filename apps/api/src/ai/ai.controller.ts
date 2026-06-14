import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(200)
  chat(@Body() chatMessageDto: ChatMessageDto) {
    return this.aiService.chat(chatMessageDto);
  }
}
