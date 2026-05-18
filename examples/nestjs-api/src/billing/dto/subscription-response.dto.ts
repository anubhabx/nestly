import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import {
  BillingInterval,
  SubscriptionStatus,
} from '../entities/subscription.entity';

export class SubscriptionResponseDto {
  @ApiResponseProperty({ example: '3e3963ab-9e2e-4bde-92cf-1739efe5169f' })
  id: string;

  @ApiProperty({ example: '6fbe8f9b-1d51-42a5-bfac-fb9a87113d2b' })
  accountId: string;

  @ApiProperty({ example: 'team-pro' })
  planCode: string;

  @ApiProperty({ enum: BillingInterval, example: BillingInterval.Month })
  interval: BillingInterval;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.Active })
  status: SubscriptionStatus;

  @ApiProperty({ example: '2026-06-16T09:30:00.000Z', format: 'date-time' })
  currentPeriodEnd: string;
}
