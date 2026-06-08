import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { IncomeService } from './income.service';

@Controller('income')
@UseGuards(JwtAuthGuard)
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() createIncomeDto: CreateIncomeDto,
  ) {
    return this.incomeService.create(userId, createIncomeDto);
  }

  @Get()
  findAll(@CurrentUserId() userId: string) {
    return this.incomeService.findAll(userId);
  }

  @Get('crop/:cropId')
  findByCrop(@CurrentUserId() userId: string, @Param('cropId') cropId: string) {
    return this.incomeService.findByCrop(userId, cropId);
  }

  @Get('month/:year/:month')
  findByMonth(
    @CurrentUserId() userId: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.incomeService.findByMonth(userId, year, month);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() updateIncomeDto: UpdateIncomeDto,
  ) {
    return this.incomeService.update(userId, id, updateIncomeDto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.incomeService.remove(userId, id);
  }
}
