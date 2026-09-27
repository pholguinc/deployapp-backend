import { PartialType, OmitType } from '@nestjs/swagger';
import {
  CreateQuizDto,
  CreateQuestionDto,
  CreateOptionDto,
} from './create-quiz.dto';

export class UpdateQuizDto extends PartialType(
  OmitType(CreateQuizDto, ['lessonId', 'questions'] as const),
) {}

export class UpdateQuestionDto extends PartialType(
  OmitType(CreateQuestionDto, ['options'] as const),
) {}

export class UpdateOptionDto extends PartialType(CreateOptionDto) {}
