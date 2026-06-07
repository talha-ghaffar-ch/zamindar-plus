import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateCropDto } from './dto/create-crop.dto';
import { CropsService } from './crops.service';

@Controller('crops')
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  @Post()
  create(@Body() createCropDto: CreateCropDto) {
    return this.cropsService.create(createCropDto);
  }

  @Get()
  findAll() {
    return this.cropsService.findAll();
  }

  @Get('zameen/:zameenId')
  findByZameen(@Param('zameenId') zameenId: string) {
    return this.cropsService.findByZameen(zameenId);
  }
}
