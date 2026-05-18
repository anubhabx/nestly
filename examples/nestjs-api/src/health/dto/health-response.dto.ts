import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: '2026-05-16T09:30:00.000Z', format: 'date-time' })
  checkedAt: string;

  @ApiProperty({ example: { database: 'up', redis: 'up' } })
  dependencies: Record<string, string>;
}
