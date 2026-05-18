import { ApiProperty } from '@nestjs/swagger';

export class WebhookAckDto {
  @ApiProperty({ example: true })
  received: boolean;

  @ApiProperty({ example: 'evt_1P9wsKLkdIwHu7ix' })
  eventId: string;
}
