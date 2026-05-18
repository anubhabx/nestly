import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { AccountPlan, AccountStatus } from '../entities/account.entity';

export class AccountResponseDto {
  @ApiResponseProperty({ example: '6fbe8f9b-1d51-42a5-bfac-fb9a87113d2b' })
  id: string;

  @ApiProperty({ example: 'acme' })
  slug: string;

  @ApiProperty({ example: 'Acme Labs' })
  name: string;

  @ApiProperty({ enum: AccountPlan, example: AccountPlan.Team })
  plan: AccountPlan;

  @ApiProperty({ enum: AccountStatus, example: AccountStatus.Active })
  status: AccountStatus;

  @ApiResponseProperty({
    example: '2026-05-16T09:30:00.000Z',
    format: 'date-time',
  })
  createdAt: string;
}
