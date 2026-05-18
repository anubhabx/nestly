import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class WebhookEventDto {
  @ApiProperty({ example: 'evt_1P9wsKLkdIwHu7ix' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'invoice.paid' })
  @IsString()
  type: string;

  @ApiProperty({ example: { invoiceId: 'in_123', accountId: 'acct_123' } })
  @IsObject()
  data: Record<string, unknown>;
}
