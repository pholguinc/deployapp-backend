import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL no está configurada en las variables de entorno',
  );
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const ROLES = [
  {
    name: 'SUPERADMIN',
    description: 'Superadministrador con acceso total a la plataforma',
  },
  {
    name: 'DOCENTE',
    description: 'Docente con permisos para gestionar cursos y alumnos',
  },
  {
    name: 'USER',
    description: 'Usuario estándar del sistema',
  },
];

const ACHIEVEMENTS = [
  {
    name: 'Docker Novato',
    icon: 'Container',
    color: '#0db7ed',
    estado: true,
    orden: 1,
  },
  {
    name: 'Explorador Cloud',
    icon: 'Cloud',
    color: '#38bdf8',
    estado: true,
    orden: 2,
  },
  {
    name: 'Terraform Básico',
    icon: 'Boxes',
    color: '#a855f7',
    estado: true,
    orden: 3,
  },
  {
    name: 'CI/CD Iniciado',
    icon: 'GitMerge',
    color: '#10B981',
    estado: true,
    orden: 4,
  },
  {
    name: 'Primer Deploy',
    icon: 'Rocket',
    color: '#f97316',
    estado: true,
    orden: 5,
  },
  {
    name: 'Guardián del Repo',
    icon: 'ShieldCheck',
    color: '#22c55e',
    estado: true,
    orden: 6,
  },
  {
    name: 'Arquitecto de Redes',
    icon: 'Network',
    color: '#6366f1',
    estado: true,
    orden: 7,
  },
  {
    name: 'Master de Ramas',
    icon: 'GitBranch',
    color: '#ec4899',
    estado: true,
    orden: 8,
  },
  {
    name: 'Rey del Pipeline',
    icon: 'Workflow',
    color: '#f59e0b',
    estado: true,
    orden: 9,
  },
  {
    name: 'Leyenda DevOps',
    icon: 'Trophy',
    color: '#eab308',
    estado: true,
    orden: 10,
  },
];

async function seedRoles(): Promise<Map<string, string>> {
  console.log('🌱 Iniciando seeder de roles...');

  const rolesMap = new Map<string, string>();

  await Promise.all(
    ROLES.map(async (role) => {
      const existingRole = await prisma.role.findUnique({
        where: { name: role.name },
      });

      if (existingRole) {
        rolesMap.set(existingRole.name, existingRole.id);
        console.log(
          `⏭️ Rol ya existe, omitiendo: ${existingRole.name} (UUID: ${existingRole.id})`,
        );
      } else {
        const createdRole = await prisma.role.create({
          data: {
            name: role.name,
            description: role.description,
          },
        });
        rolesMap.set(createdRole.name, createdRole.id);
        console.log(
          `✅ Rol creado: ${createdRole.name} (UUID: ${createdRole.id})`,
        );
      }
    }),
  );

  console.log('✨ Verificación de roles completada.');
  return rolesMap;
}

async function seedSuperAdmin(rolesMap: Map<string, string>) {
  console.log('🌱 Iniciando seeder de usuario SUPERADMIN...');

  const superAdminRoleId = rolesMap.get('SUPERADMIN');
  if (!superAdminRoleId) {
    throw new Error(
      'No se encontró el rol SUPERADMIN para vincular al usuario',
    );
  }

  const superAdminEmail = (
    process.env.SUPERADMIN_EMAIL ?? 'superadmin@deployapp.com'
  )
    .toLowerCase()
    .trim();
  const superAdminPassword =
    process.env.SUPERADMIN_PASSWORD ?? 'SuperAdmin123*';
  const superAdminName = process.env.SUPERADMIN_NAME ?? 'Super Administrador';

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
    include: { role: true },
  });

  if (existingSuperAdmin) {
    console.log(
      `⏭️ Usuario SUPERADMIN ya existe (${existingSuperAdmin.email}), omitiendo creación.`,
    );
    console.log(`   ID: ${existingSuperAdmin.id}`);
    console.log(`   Rol: ${existingSuperAdmin.role?.name}`);
  } else {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(superAdminPassword, saltRounds);

    const superAdminUser = await prisma.user.create({
      data: {
        email: superAdminEmail,
        password: passwordHash,
        name: superAdminName,
        lastname: 'Root',
        phone: '000000000',
        isActive: true,
        roleId: superAdminRoleId,
      },
      include: {
        role: true,
      },
    });

    console.log(`✅ Usuario SUPERADMIN creado: ${superAdminUser.email}`);
    console.log(`   ID: ${superAdminUser.id}`);
    console.log(`   Rol: ${superAdminUser.role?.name}`);
  }
}

async function seedTestUsers(rolesMap: Map<string, string>) {
  console.log('🌱 Iniciando seeder de usuarios de prueba...');

  const TEST_USERS = [
    {
      email: 'admin@deployapp.com',
      password: 'AdminPassword123*',
      name: 'Admin',
      lastname: 'Usuario',
      phone: '111111111',
      role: 'ADMIN',
    },
    {
      email: 'docente@deployapp.com',
      password: 'DocentePassword123*',
      name: 'Docente',
      lastname: 'Usuario',
      phone: '222222222',
      role: 'DOCENTE',
    },
    {
      email: 'user@deployapp.com',
      password: 'UserPassword123*',
      name: 'Standard',
      lastname: 'Usuario',
      phone: '333333333',
      role: 'USER',
    },
  ];

  for (let i = 1; i <= 27; i++) {
    TEST_USERS.push({
      email: `testuser${i}@deployapp.com`,
      password: `TestUser123*`,
      name: `Test`,
      lastname: `Usuario ${i}`,
      phone: `555000${i.toString().padStart(3, '0')}`,
      role: 'USER',
    });
  }

  await Promise.all(
    TEST_USERS.map(async (testUser) => {
      const roleId = rolesMap.get(testUser.role);
      if (!roleId) return;

      const existingUser = await prisma.user.findUnique({
        where: { email: testUser.email },
      });

      if (existingUser) {
        console.log(
          `⏭️ Usuario de prueba ya existe, omitiendo: ${testUser.email}`,
        );
      } else {
        const passwordHash = await bcrypt.hash(testUser.password, 10);
        const createdUser = await prisma.user.create({
          data: {
            email: testUser.email,
            password: passwordHash,
            name: testUser.name,
            lastname: testUser.lastname,
            phone: testUser.phone,
            isActive: true,
            roleId,
          },
        });
        console.log(
          `✅ Usuario de prueba creado: ${createdUser.email} (Rol: ${testUser.role})`,
        );
      }
    }),
  );
}

async function seedAchievements() {
  console.log('🌱 Iniciando seeder de logros (achievements)...');

  await Promise.all(
    ACHIEVEMENTS.map(async (achievement) => {
      const existing = await prisma.achievement.findFirst({
        where: { name: achievement.name },
      });

      if (existing) {
        console.log(`⏭️ Logro ya existe, omitiendo: ${existing.name}`);
      } else {
        const created = await prisma.achievement.create({
          data: achievement,
        });
        console.log(
          `✅ Logro creado: ${created.name} (orden: ${created.orden})`,
        );
      }
    }),
  );
}

async function seedCourse() {
  console.log('🌱 Iniciando seeder de Catálogo de Cursos...');
  const existingCourse = await prisma.course.findFirst({
    where: { title: 'Docker & Contenedores: De Cero a Experto' },
  });

  if (existingCourse) {
    console.log(`⏭️ Curso ya existe, omitiendo: ${existingCourse.title}`);
  } else {
    const docenteUser = await prisma.user.findUnique({
      where: { email: 'docente@deployapp.com' },
    });

    const course = await prisma.course.create({
      data: {
        title: 'Docker & Contenedores: De Cero a Experto',
        description:
          'Aprende a empaquetar, distribuir y ejecutar aplicaciones con Docker, Docker Compose y optimización de contenedores.',
        category: 'Docker',
        level: 'Principiante',
        duration: '14h de video',
        lessonsCount: 36,
        rating: 4.9,
        instructorId: docenteUser?.id,
        imageUrl:
          'https://images.unsplash.com/photo-1605745341112-85968b19335b?auto=format&fit=crop&q=80&w=2000',
        modules: {
          create: [
            {
              title: 'Módulo 1: Fundamentos de Contenedores y Docker CLI',
              order: 1,
              lessons: {
                create: [
                  {
                    title: '¿Qué es un contenedor y por qué Docker?',
                    duration: '08:35 min',
                    type: 'VIDEO',
                    order: 1,
                    resources: {
                      create: [
                        {
                          name: 'Diapositivas: Contenedores vs Máquinas Virtuales (PDF)',
                          type: 'PDF',
                          size: '3.8 MB',
                          url: '#',
                        },
                        {
                          name: 'Glosario de Arquitectura Docker (PDF)',
                          type: 'PDF',
                          size: '1.4 MB',
                          url: '#',
                        },
                      ],
                    },
                    quizzes: {
                      create: [
                        {
                          title: 'EVALUACIÓN DE LA LECCIÓN 1',
                          questions: {
                            create: [
                              {
                                text: '¿Cuál es la principal ventaja técnica de un contenedor sobre una máquina virtual clásica?',
                                options: {
                                  create: [
                                    {
                                      text: 'Emula su propia BIOS y hardware físico dedicado',
                                      isCorrect: false,
                                    },
                                    {
                                      text: 'Comparte el kernel del sistema operativo anfitrión',
                                      isCorrect: true,
                                    },
                                    {
                                      text: 'Requiere instalar un sistema operativo completo adicional',
                                      isCorrect: false,
                                    },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                  {
                    title: 'Instalación de Docker en Windows, Mac y Linux',
                    duration: '12:15 min',
                    type: 'VIDEO',
                    order: 2,
                  },
                  {
                    title: 'Tu primer contenedor: Hello World',
                    duration: '05:40 min',
                    type: 'VIDEO',
                    order: 3,
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    // Añadir comentarios
    const lesson1 = course.modules[0].lessons[0];
    const dummyUser = await prisma.user.findFirst({
      where: { email: 'admin@deployapp.com' },
    });

    if (dummyUser) {
      await prisma.comment.create({
        data: {
          text: '¿Por qué Docker arranca en milisegundos a diferencia de una máquina virtual?',
          likes: 8,
          lessonId: lesson1.id,
          userId: dummyUser.id,
        },
      });
    }

    // Inscribir al superadmin
    const superAdminFound = await prisma.user.findFirst({
      where: { email: 'superadmin@deployapp.com' },
    });
    if (superAdminFound) {
      await prisma.userCourse.create({
        data: {
          userId: superAdminFound.id,
          courseId: course.id,
          status: 'ENROLLED',
          progress: 5,
        },
      });
    }

    console.log(`✅ Curso creado: ${course.title}`);
  }
}

async function seedSettings() {
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
      description:
        'Configuración global y unificada de la plataforma DeployLab',
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

  await Promise.all(
    SETTINGS_SEEDS.map(async (item) => {
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
      console.log(`✅ Configuración sembrada: "${setting.key}"`);
    }),
  );

  const superAdmin = await prisma.user.findFirst({
    where: { email: 'superadmin@deployapp.com' },
  });

  if (superAdmin) {
    await prisma.user.update({
      where: { id: superAdmin.id },
      data: {
        phone: '+51 999 888 777',
        name: 'Super Administrador',
        lastname: 'Root',
      },
    });
    console.log(
      '✅ Perfil del Super Administrador actualizado con teléfono (+51 999 888 777).',
    );
  }
}

async function main() {
  const rolesMap = await seedRoles();
  await seedSuperAdmin(rolesMap);
  await seedTestUsers(rolesMap);
  await seedAchievements();
  await seedCourse();
  await seedSettings();

  console.log('✨ Seeder completado exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
