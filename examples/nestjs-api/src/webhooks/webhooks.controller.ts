import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { WebhookAckDto } from './dto/webhook-ack.dto';
import { WebhookEventDto } from './dto/webhook-event.dto';
import { WebhookSignatureGuard } from './guards/webhook-signature.guard';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Public()
  @Post('stripe')
  @UseGuards(WebhookSignatureGuard)
  @ApiSecurity('stripeSignature')
  @ApiOperation({
    operationId: 'handleStripeWebhook',
    summary: 'Handle Stripe webhook',
  })
  @ApiCreatedResponse({ description: 'Webhook accepted.', type: WebhookAckDto })
  stripe(@Body() dto: WebhookEventDto): WebhookAckDto {
    return this.webhooks.handleStripeEvent(dto);
  }
}
