import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ExamsModule } from './modules/exams/exams.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { IndicatorsModule } from './modules/indicators/indicators.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AchievementsModule,
    CoursesModule,
    LessonsModule,
    CommentsModule,
    ExamsModule,
    ReportsModule,
    SettingsModule,
    NotificationsModule,
    WebhooksModule,
    IndicatorsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
