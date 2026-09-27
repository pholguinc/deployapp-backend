import { Injectable, NotFoundException } from '@nestjs/common';
import { AchievementsRepository } from '../repositories/achievements.repository';
import { CreateAchievementRequestDto } from '../dtos/requests/create-achievement.request.dto';
import { UpdateAchievementRequestDto } from '../dtos/requests/update-achievement.request.dto';
import { AchievementResponseDto } from '../dtos/responses/achievement.response.dto';
import { PaginatedAchievementsResponseDto } from '../dtos/responses/paginated-achievements.response.dto';

@Injectable()
export class AchievementService {
  constructor(
    private readonly achievementsRepository: AchievementsRepository,
  ) {}

  async create(
    data: CreateAchievementRequestDto,
    userId?: string,
  ): Promise<AchievementResponseDto> {
    const achievement = await this.achievementsRepository.create({
      ...data,
      estado: data.estado ?? true,
      orden: data.orden ?? 0,
      createdBy: userId,
    });
    return new AchievementResponseDto(achievement);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedAchievementsResponseDto> {
    const skip = (page - 1) * limit;
    const [achievements, totalItems] =
      await this.achievementsRepository.findAll(skip, limit);

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      data: achievements.map((a) => new AchievementResponseDto(a)),
      meta: {
        firstPage: 1,
        lastPage: totalPages,
        currentPage: page,
        totalPages,
        totalItems,
      },
    };
  }

  async findOne(id: string): Promise<AchievementResponseDto> {
    const achievement = await this.achievementsRepository.findById(id);
    if (!achievement) {
      throw new NotFoundException(`Achievement with ID ${id} not found`);
    }
    return new AchievementResponseDto(achievement);
  }

  async update(
    id: string,
    data: UpdateAchievementRequestDto,
    userId?: string,
  ): Promise<AchievementResponseDto> {
    await this.findOne(id); // Ensure it exists
    const achievement = await this.achievementsRepository.update(id, {
      ...data,
      updatedBy: userId,
    });
    return new AchievementResponseDto(achievement);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.achievementsRepository.remove(id);
  }
}
