import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CreateZameenDto } from './dto/create-zameen.dto';
import { ZameenService } from './zameen.service';

@Controller('zameen')
export class ZameenController {
  constructor(private readonly zameenService: ZameenService) {}

  @Post()
  create(@Body() createZameenDto: CreateZameenDto) {
    return this.zameenService.create(createZameenDto);
  }

  @Get()
  findAll() {
    return this.zameenService.findAll();
  }

  @Get('profile/:profileId')
  findByProfile(@Param('profileId') profileId: string) {
    return this.zameenService.findByProfile(profileId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.zameenService.remove(id);
  }
}
