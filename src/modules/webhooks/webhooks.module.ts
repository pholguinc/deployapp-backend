import { Module } from '@nestjs/common';
import { WebhooksController } from './controllers/webhooks.controller';
import { WebhooksService } from './services/webhooks.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
