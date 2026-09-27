import { PartialType } from '@nestjs/swagger';
import { CreateAchievementRequestDto } from './create-achievement.request.dto';

export class UpdateAchievementRequestDto extends PartialType(
  CreateAchievementRequestDto,
) {}
