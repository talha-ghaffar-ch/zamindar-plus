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
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.expensesService.create(userId, createExpenseDto);
  }

  @Get()
  findAll(@CurrentUserId() userId: string) {
    return this.expensesService.findAll(userId);
  }

  @Get('crop/:cropId')
  findByCrop(@CurrentUserId() userId: string, @Param('cropId') cropId: string) {
    return this.expensesService.findByCrop(userId, cropId);
  }

  @Get('month/:year/:month')
  findByMonth(
    @CurrentUserId() userId: string,
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
  ) {
    return this.expensesService.findByMonth(userId, year, month);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(userId, id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.expensesService.remove(userId, id);
  }
}
