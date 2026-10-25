import { Module } from '@nestjs/common';
import { ExamsService } from './services/exams.service';
import { ExamsController } from './controllers/exams.controller';
import { ExamsRepository } from './repositories/exams.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { CoursesModule } from '../courses/courses.module';
import { CoursesRepository } from '../courses/repositories/courses.repository';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, CoursesModule, NotificationsModule, UploadModule],
  controllers: [ExamsController],
  providers: [ExamsService, ExamsRepository, CoursesRepository],
  exports: [ExamsService],
})
export class ExamsModule {}
