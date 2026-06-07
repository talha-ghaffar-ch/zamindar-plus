import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreateIncomeDto } from './dto/create-income.dto';
import { IncomeService } from './income.service';

@Controller('income')
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  create(@Body() createIncomeDto: CreateIncomeDto) {
    return this.incomeService.create(createIncomeDto);
  }

  @Get()
  findAll() {
    return this.incomeService.findAll();
  }

  @Get('crop/:cropId')
  findByCrop(@Param('cropId') cropId: string) {
    return this.incomeService.findByCrop(cropId);
  }

  @Get('month/:year/:month')
  findByMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.incomeService.findByMonth(year, month);
  }
}
