import { Injectable } from '@nestjs/common';
import { WebhookAckDto } from './dto/webhook-ack.dto';
import { WebhookEventDto } from './dto/webhook-event.dto';

@Injectable()
export class WebhooksService {
  handleStripeEvent(dto: WebhookEventDto): WebhookAckDto {
    return {
      received: true,
      eventId: dto.id,
    };
  }
}
