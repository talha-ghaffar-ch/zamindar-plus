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
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';
import { CropsService } from './crops.service';

@UseGuards(JwtAuthGuard)
@Controller('crops')
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() createCropDto: CreateCropDto,
  ) {
    return this.cropsService.create(userId, createCropDto);
  }

  @Get()
  findAll(@CurrentUserId() userId: string) {
    return this.cropsService.findAll(userId);
  }

  @Get('zameen/:zameenId')
  findByZameen(
    @CurrentUserId() userId: string,
    @Param('zameenId') zameenId: string,
  ) {
    return this.cropsService.findByZameen(userId, zameenId);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() updateCropDto: UpdateCropDto,
  ) {
    return this.cropsService.update(userId, id, updateCropDto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.cropsService.remove(userId, id);
  }
}
