import { Module } from '@nestjs/common';
import { AchievementsController } from './controllers/achievements.controller';
import { AchievementService } from './services/achievements.service';
import { AchievementsRepository } from './repositories/achievements.repository';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AchievementsController],
  providers: [AchievementService, AchievementsRepository],
  exports: [AchievementService],
})
export class AchievementsModule {}
