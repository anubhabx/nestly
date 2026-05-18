import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { MembershipRole } from '../entities/account-member.entity';

export class MemberResponseDto {
  @ApiResponseProperty({ example: 'dc8f0a66-cad3-44f2-b074-d6dd50c5deda' })
  id: string;

  @ApiProperty({ example: 'ada@example.com', format: 'email' })
  email: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  name: string;

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.Admin })
  role: MembershipRole;

  @ApiProperty({ example: '2026-05-16T09:30:00.000Z', format: 'date-time' })
  createdAt: string;
}
