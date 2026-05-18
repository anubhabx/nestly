import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { InvoiceStatus } from '../entities/invoice.entity';

export class InvoiceQueryDto {
  @ApiPropertyOptional({ enum: InvoiceStatus, example: InvoiceStatus.Open })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}
