import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';

import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { CoursesService } from '../services/courses.service';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { UpdateCourseDto } from '../dtos/update-course.dto';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import {
  CreateCourseModuleDto,
  UpdateCourseModuleDto,
} from '../dtos/course-module.dto';
import { UpdateUserCourseProgressDto } from '../dtos/user-course.dto';
import { CreateCourseReviewDto } from '../dtos/course-review.dto';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // --- COURSES ---
  @Post()
  @Roles('SUPERADMIN', 'ADMIN')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Create a new course' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Get('list')
  @Public()
  @ApiOperation({
    summary: 'List courses with pagination and role-based filtering',
  })
  findAll(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('scope') scope?: string,
    @Query('search') search?: string,
  ) {
    const user = req?.user || null;
    return this.coursesService.findAll(+page, +limit, user, scope, search);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get course by ID including modules and lessons' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Post(':id/image')
  @Roles('SUPERADMIN', 'ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload course image to S3' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.coursesService.uploadImage(id, file);
  }

  @Patch(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ summary: 'Update course by ID' })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete course by ID' })
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }

  // --- MODULES ---
  @Post(':courseId/modules')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Add a module to a course' })
  addModule(
    @Param('courseId') courseId: string,
    @Body() createDto: CreateCourseModuleDto,
  ) {
    return this.coursesService.addModule(courseId, createDto);
  }

  @Patch('modules/:moduleId')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Update a module by ID' })
  updateModule(
    @Param('moduleId') moduleId: string,
    @Body() updateDto: UpdateCourseModuleDto,
  ) {
    return this.coursesService.updateModule(moduleId, updateDto);
  }

  @Delete('modules/:moduleId')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Delete a module by ID' })
  removeModule(@Param('moduleId') moduleId: string) {
    return this.coursesService.removeModule(moduleId);
  }

  // --- ENROLLMENTS ---
  @Post(':courseId/enroll')
  @ApiOperation({ summary: 'Enroll current user in a course' })
  enroll(@Request() req: RequestUser, @Param('courseId') courseId: string) {
    const userId = req.user.id;
    return this.coursesService.enrollUser(userId, courseId);
  }

  @Get(':courseId/enrollment-status')
  @ApiOperation({ summary: 'Check if current user is enrolled in a course' })
  checkEnrollmentStatus(
    @Request() req: RequestUser,
    @Param('courseId') courseId: string,
  ) {
    const userId = req.user.id;
    return this.coursesService.checkEnrollmentStatus(userId, courseId);
  }

  @Patch(':courseId/progress')
  @ApiOperation({ summary: 'Update current user progress in a course' })
  updateProgress(
    @Request() req: RequestUser,
    @Param('courseId') courseId: string,
    @Body() updateDto: UpdateUserCourseProgressDto,
  ) {
    const userId = req.user.id;
    return this.coursesService.updateProgress(userId, courseId, updateDto);
  }

  // --- REVIEWS ---
  @Post(':courseId/reviews')
  @ApiOperation({ summary: 'Submit a review and rating for a course' })
  submitReview(
    @Request() req: RequestUser,
    @Param('courseId') courseId: string,
    @Body() createDto: CreateCourseReviewDto,
  ) {
    const userId = req.user.id;
    return this.coursesService.addReview(userId, courseId, createDto);
  }

  @Get(':courseId/reviews')
  @Public()
  @ApiOperation({ summary: 'Get all reviews for a course' })
  getReviews(@Param('courseId') courseId: string) {
    return this.coursesService.getReviews(courseId);
  }
}
