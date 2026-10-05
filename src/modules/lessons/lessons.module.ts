import { Module } from '@nestjs/common';
import { LessonsService } from './services/lessons.service';
import { LessonsRepository } from './repositories/lessons.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { LessonsController } from './controllers/lessons.controller';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [LessonsController],
  providers: [LessonsService, LessonsRepository],
  exports: [LessonsService],
})
export class LessonsModule {}
