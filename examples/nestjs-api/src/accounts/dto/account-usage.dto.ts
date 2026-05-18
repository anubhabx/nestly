import { ApiProperty } from '@nestjs/swagger';

export class AccountUsageDto {
  @ApiProperty({ example: 7, minimum: 0 })
  projectCount: number;
}
