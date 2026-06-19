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
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body() createProfileDto: CreateProfileDto,
  ) {
    return this.profilesService.create(userId, createProfileDto);
  }

  @Get()
  findAll(@CurrentUserId() userId: string) {
    return this.profilesService.findAll(userId);
  }

  @Get('user/:userId')
  findByUser(
    @CurrentUserId() currentUserId: string,
    @Param('userId') userId: string,
  ) {
    return this.profilesService.findByUser(currentUserId, userId);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(userId, id, updateProfileDto);
  }

  @Delete(':id')
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.profilesService.remove(userId, id);
  }
}
