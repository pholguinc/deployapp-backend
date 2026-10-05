import { Prisma, PrismaClient } from '@prisma/client';

const DEFAULT_PLATFORM_SETTINGS = {
  platformName: 'DeployLab Academy',
  platformDescription:
    'Plataforma de formación práctica en DevOps, Cloud Architecture y Desarrollo de Software.',
  supportEmail: 'soporte@deploylab.io',
  publicUrl: 'https://deploylab.io',
  certificatePrefix: 'DPLB-CERT',
  timezone: 'America/Bogota (UTC-5)',
  language: 'Español (Latinoamérica)',
  minPassingScore: 14,
  maxExamAttempts: 3,
  minAttendancePercent: 80,
  autoIssueCertificates: true,
  sequentialLessons: true,
  allowStudentComments: true,
  allowPublicRegistration: true,
  requireEmailVerification: false,
  sessionTimeoutHours: 24,
  notifyOnStudentPass: true,
  notifyOnNewRegistration: true,
  notifyOnCertificateIssued: true,
};

const SETTINGS_SEEDS: Array<{
  key: string;
  description: string;
  value: Prisma.InputJsonValue;
}> = [
  {
    key: 'platform_settings',
    description: 'Configuración global y unificada de la plataforma DeployLab',
    value: DEFAULT_PLATFORM_SETTINGS,
  },
  {
    key: 'general_settings',
    description:
      'Parámetros institucionales visibles en certificados, portal y correos',
    value: {
      platformName: DEFAULT_PLATFORM_SETTINGS.platformName,
      platformDescription: DEFAULT_PLATFORM_SETTINGS.platformDescription,
      supportEmail: DEFAULT_PLATFORM_SETTINGS.supportEmail,
      publicUrl: DEFAULT_PLATFORM_SETTINGS.publicUrl,
      certificatePrefix: DEFAULT_PLATFORM_SETTINGS.certificatePrefix,
      timezone: DEFAULT_PLATFORM_SETTINGS.timezone,
      language: DEFAULT_PLATFORM_SETTINGS.language,
    },
  },
  {
    key: 'academic_settings',
    description:
      'Criterios de evaluación, reglas de cursado y emisión de certificados',
    value: {
      minPassingScore: DEFAULT_PLATFORM_SETTINGS.minPassingScore,
      maxExamAttempts: DEFAULT_PLATFORM_SETTINGS.maxExamAttempts,
      minAttendancePercent: DEFAULT_PLATFORM_SETTINGS.minAttendancePercent,
      autoIssueCertificates: DEFAULT_PLATFORM_SETTINGS.autoIssueCertificates,
      sequentialLessons: DEFAULT_PLATFORM_SETTINGS.sequentialLessons,
      allowStudentComments: DEFAULT_PLATFORM_SETTINGS.allowStudentComments,
    },
  },
  {
    key: 'security_settings',
    description:
      'Políticas de acceso, registro público y expiración de sesiones',
    value: {
      allowPublicRegistration:
        DEFAULT_PLATFORM_SETTINGS.allowPublicRegistration,
      requireEmailVerification:
        DEFAULT_PLATFORM_SETTINGS.requireEmailVerification,
      sessionTimeoutHours: DEFAULT_PLATFORM_SETTINGS.sessionTimeoutHours,
      encryptionAlgorithm: 'Bcrypt (Salt rounds = 10)',
      tokenFormat: 'JSON Web Tokens (JWT) + cookies HttpOnly',
      auditedRoles: ['ADMINISTRADOR', 'DOCENTE', 'ALUMNO'],
    },
  },
  {
    key: 'notification_settings',
    description:
      'Eventos del sistema que disparan notificaciones automáticas',
    value: {
      notifyOnNewRegistration:
        DEFAULT_PLATFORM_SETTINGS.notifyOnNewRegistration,
      notifyOnStudentPass: DEFAULT_PLATFORM_SETTINGS.notifyOnStudentPass,
      notifyOnCertificateIssued:
        DEFAULT_PLATFORM_SETTINGS.notifyOnCertificateIssued,
    },
  },
];

export async function testUpsert(prisma: PrismaClient) {
  for (const item of SETTINGS_SEEDS) {
    const setting = await prisma.setting.upsert({
      where: { key: item.key },
      update: {
        value: item.value,
        description: item.description,
      },
      create: {
        key: item.key,
        value: item.value,
        description: item.description,
      },
    });
    console.log(setting.key);
  }
}
