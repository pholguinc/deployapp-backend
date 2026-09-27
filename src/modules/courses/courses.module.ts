import { Module } from '@nestjs/common';
import { CoursesRepository } from './repositories/courses.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { CoursesController } from './controllers/courses.controller';
import { CoursesService } from './services/courses.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [CoursesController],
  providers: [CoursesService, CoursesRepository],
  exports: [CoursesService],
})
export class CoursesModule {}
