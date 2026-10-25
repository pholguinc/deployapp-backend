import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import express from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { ExamsService } from '../services/exams.service';
import {
  CreateFinalExamRequestDto,
  SubmitFinalExamRequestDto,
  FinalExamResponseDto,
  SubmitFinalExamResponseDto,
  ExamAttemptResponseDto,
  CertificateResponseDto,
  GradePracticalExamRequestDto,
} from '../dtos';
import type { RequestUser } from 'src/common/interfaces/request-user.interface';
import type { FinalExam } from '@prisma/client';

@ApiTags('Final Exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses/:courseId/final-exam')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  // ── ADMIN: Create or update final exam ────────────────────────────────────

  @Put()
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({
    summary: 'Save or update the final exam for a course (admin only)',
  })
  @ApiResponse({ status: 200, type: FinalExamResponseDto })
  upsertExam(
    @Param('courseId') courseId: string,
    @Body() dto: CreateFinalExamRequestDto,
  ): Promise<FinalExamResponseDto> {
    return this.examsService.upsertExam(courseId, dto);
  }

  @Patch()
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({
    summary: 'Update the final exam for a course (admin only)',
  })
  @ApiResponse({ status: 200, type: FinalExamResponseDto })
  patchExam(
    @Param('courseId') courseId: string,
    @Body() dto: CreateFinalExamRequestDto,
  ): Promise<FinalExamResponseDto> {
    return this.examsService.upsertExam(courseId, dto);
  }

  // ── ADMIN: Get exam with answers ──────────────────────────────────────────

  @Get('admin')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Get the final exam with answers (admin view)' })
  getExamForAdmin(@Param('courseId') courseId: string) {
    return this.examsService.getExamForAdmin(courseId);
  }

  // ── ADMIN / DOCENTE: List all student exam submissions (teórico + práctico)

  @Get('submissions')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({
    summary: 'Get all student exam submissions and practical status for a course',
  })
  getSubmissions(@Param('courseId') courseId: string) {
    return this.examsService.getPracticalSubmissions(courseId);
  }

  // ── ADMIN / DOCENTE: Grade practical exam PDF ──────────────────────────────

  @Post('submissions/:attemptId/grade')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({
    summary: 'Grade practical exam PDF, compute average score and issue certificate if passed',
  })
  gradePracticalExam(
    @Request() req: RequestUser,
    @Param('courseId') courseId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: GradePracticalExamRequestDto,
  ) {
    return this.examsService.gradePracticalExam(
      courseId,
      attemptId,
      req.user.id,
      dto,
    );
  }

  // ── ADMIN / DOCENTE: Upload practical exam guide PDF ───────────────────────

  @Post('practical-guide')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Upload official practical exam guide/template PDF' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadPracticalGuide(
    @Param('courseId') courseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.examsService.uploadPracticalGuide(courseId, file);
  }

  // ── ADMIN / DOCENTE: Upload PDF on behalf of student ───────────────────────

  @Post('submissions/:attemptId/upload-file')
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Attach student practical PDF manually by instructor' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  uploadStudentPracticalFile(
    @Param('courseId') courseId: string,
    @Param('attemptId') attemptId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.examsService.uploadStudentPracticalFile(courseId, attemptId, file);
  }

  // ── ADMIN: Create final exam ───────────────────────────────────────────────

  @Post()
  @Roles('SUPERADMIN', 'ADMIN', 'DOCENTE')
  @ApiOperation({ summary: 'Create the final exam for a course (admin only)' })
  @ApiResponse({ status: 201, type: FinalExamResponseDto })
  createExam(
    @Param('courseId') courseId: string,
    @Body() dto: CreateFinalExamRequestDto,
  ): Promise<FinalExamResponseDto> {
    return this.examsService.createExam(courseId, dto);
  }

  // ── STUDENT: Get exam questions (without isCorrect) ────────────────────────

  @Get()
  @ApiOperation({
    summary: 'Get the final exam for a course (student view – no answers)',
  })
  @ApiResponse({ status: 200, type: FinalExamResponseDto })
  getExam(@Param('courseId') courseId: string): Promise<FinalExamResponseDto> {
    return this.examsService.getExamByCourse(courseId);
  }

  // ── STUDENT: Submit theoretical exam answers ───────────────────────────────

  @Post('submit')
  @ApiOperation({ summary: 'Submit theoretical exam answers' })
  @ApiResponse({ status: 201, type: SubmitFinalExamResponseDto })
  submitExam(
    @Request() req: RequestUser,
    @Param('courseId') courseId: string,
    @Body() dto: SubmitFinalExamRequestDto,
  ): Promise<SubmitFinalExamResponseDto> {
    return this.examsService.submitExam(req.user.id, courseId, dto);
  }

  // ── STUDENT: Submit practical exam PDF ──────────────────────────────────────

  @Post('practical-submit')
  @ApiOperation({ summary: 'Submit practical exam PDF report for instructor review' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Documento PDF del examen práctico de despliegue',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  submitPractical(
    @Request() req: RequestUser,
    @Param('courseId') courseId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.examsService.submitPracticalExam(req.user.id, courseId, file);
  }

  // ── STUDENT: Get last attempt result ──────────────────────────────────────

  @Get('my-attempt')
  @ApiOperation({
    summary: 'Get the current user last exam attempt for a course',
  })
  @ApiResponse({ status: 200, type: ExamAttemptResponseDto })
  getLastAttempt(
    @Request() req: RequestUser,
    @Param('courseId') courseId: string,
  ): Promise<ExamAttemptResponseDto> {
    return this.examsService.getLastAttempt(req.user.id, courseId);
  }

  // ── STUDENT: Get certificate info ─────────────────────────────────────────

  @Get('certificate')
  @ApiOperation({
    summary: 'Get certificate metadata (score ≥ 15/20 required)',
  })
  @ApiResponse({ status: 200, type: CertificateResponseDto })
  getCertificate(
    @Request() req: RequestUser,
    @Param('courseId') courseId: string,
  ): Promise<CertificateResponseDto> {
    return this.examsService.getCertificate(req.user.id, courseId);
  }

  // ── STUDENT: Download certificate as PDF ──────────────────────────────────

  @Get('certificate/download')
  @ApiOperation({ summary: 'Download the completion certificate as PDF' })
  @ApiResponse({
    status: 200,
    description: 'PDF binary stream of the certificate',
  })
  async downloadCertificate(
    @Request() req: RequestUser,
    @Param('courseId') courseId: string,
    @Res() res: express.Response,
  ): Promise<void> {
    await this.examsService.generateCertificatePdf(req.user.id, courseId, res);
  }

  // ── ADMIN: Delete exam ────────────────────────────────────────────────────

  @Delete()
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete the final exam of a course (admin only)' })
  async deleteExam(@Param('courseId') courseId: string): Promise<FinalExam> {
    const exam = await this.examsService.getExamByCourse(courseId);
    return this.examsService.deleteExam(exam.id);
  }
}
