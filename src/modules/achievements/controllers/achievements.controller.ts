import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AchievementService } from '../services/achievements.service';
import { CreateAchievementRequestDto } from '../dtos/requests/create-achievement.request.dto';
import { UpdateAchievementRequestDto } from '../dtos/requests/update-achievement.request.dto';
import { AchievementResponseDto } from '../dtos/responses/achievement.response.dto';
import { PaginatedAchievementsResponseDto } from '../dtos/responses/paginated-achievements.response.dto';

@ApiTags('Achievements')
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new achievement' })
  @ApiResponse({ status: 201, type: AchievementResponseDto })
  create(@Body() createAchievementDto: CreateAchievementRequestDto) {
    // Note: To get userId you can use an Auth Guard and extract from req.user.id
    return this.achievementsService.create(createAchievementDto);
  }

  @Get('list')
  @ApiOperation({ summary: 'Get paginated achievements' })
  @ApiResponse({ status: 200, type: PaginatedAchievementsResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.achievementsService.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an achievement by ID' })
  @ApiResponse({ status: 200, type: AchievementResponseDto })
  findOne(@Param('id') id: string) {
    return this.achievementsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an achievement' })
  @ApiResponse({ status: 200, type: AchievementResponseDto })
  update(
    @Param('id') id: string,
    @Body() updateAchievementDto: UpdateAchievementRequestDto,
  ) {
    return this.achievementsService.update(id, updateAchievementDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an achievement' })
  @ApiResponse({ status: 204 })
  remove(@Param('id') id: string) {
    return this.achievementsService.remove(id);
  }
}
