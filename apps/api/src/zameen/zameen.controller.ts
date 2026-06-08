import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateZameenDto } from './dto/create-zameen.dto';
import { UpdateZameenDto } from './dto/update-zameen.dto';
import { ZameenService } from './zameen.service';

@UseGuards(JwtAuthGuard)
@Controller('zameen')
export class ZameenController {
  constructor(private readonly zameenService: ZameenService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() createZameenDto: CreateZameenDto,
  ) {
    return this.zameenService.create(userId, createZameenDto);
  }

  @Get()
  findAll(@CurrentUserId() userId: string) {
    return this.zameenService.findAll(userId);
  }

  @Get('profile/:profileId')
  findByProfile(
    @CurrentUserId() userId: string,
    @Param('profileId') profileId: string,
  ) {
    return this.zameenService.findByProfile(userId, profileId);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() updateZameenDto: UpdateZameenDto,
  ) {
    return this.zameenService.update(userId, id, updateZameenDto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.zameenService.remove(userId, id);
  }
}
