import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CertificateUserResponseDto {
  @ApiProperty({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Juan' })
  name?: string | null;

  @ApiPropertyOptional({ example: 'Pérez' })
  lastname?: string | null;
}

export class CertificateCourseResponseDto {
  @ApiProperty({ example: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Docker & Kubernetes Masterclass' })
  title: string;
}

export class CertificateResponseDto {
  @ApiProperty({ example: 'cert-1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'u1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  userId: string;

  @ApiProperty({ example: 'c1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  courseId: string;

  @ApiProperty({ example: 18.5, description: 'Nota final obtenida sobre 20' })
  score: number;

  @ApiProperty({ example: '2026-10-04T04:20:00.000Z' })
  issuedAt: Date;

  @ApiProperty({ type: CertificateUserResponseDto })
  user: CertificateUserResponseDto;

  @ApiProperty({ type: CertificateCourseResponseDto })
  course: CertificateCourseResponseDto;
}
