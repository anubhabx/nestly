import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '../entities/invoice.entity';

export class InvoiceResponseDto {
  @ApiResponseProperty({ example: '02bce802-e39c-4924-b0d5-e9891d74c898' })
  id: string;

  @ApiProperty({ example: 'INV-2026-0001' })
  number: string;

  @ApiProperty({ enum: InvoiceStatus, example: InvoiceStatus.Open })
  status: InvoiceStatus;

  @ApiProperty({ example: 4900 })
  amountCents: number;

  @ApiProperty({ example: 'usd' })
  currency: string;

  @ApiProperty({ example: '2026-06-01T12:00:00.000Z', format: 'date-time' })
  dueAt: string;
}
