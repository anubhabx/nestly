import { Module } from '@nestjs/common';
import { WebhookSignatureGuard } from './guards/webhook-signature.guard';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  controllers: [WebhooksController],
  providers: [WebhookSignatureGuard, WebhooksService],
})
export class WebhooksModule {}
