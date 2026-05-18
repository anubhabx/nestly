import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { BillingInterval } from '../entities/subscription.entity';

export class CheckoutSessionDto {
  @ApiProperty({ example: 'team-pro' })
  @IsString()
  planCode: string;

  @ApiProperty({ enum: BillingInterval, example: BillingInterval.Month })
  @IsEnum(BillingInterval)
  interval: BillingInterval;

  @ApiProperty({ example: 'https://app.example.com/billing/success' })
  @IsString()
  successUrl: string;

  @ApiProperty({ example: 'https://app.example.com/billing/cancel' })
  @IsString()
  cancelUrl: string;
}
