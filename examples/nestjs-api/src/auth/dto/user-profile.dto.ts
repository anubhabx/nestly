import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { UserStatus } from '../../users/entities/user.entity';

export class UserProfileDto {
  @ApiResponseProperty({ example: '63ffdfcf-3635-4b59-95db-6d47ddfb30ee' })
  id: string;

  @ApiProperty({ example: 'ada@example.com', format: 'email' })
  email: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  name: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.Active })
  status: UserStatus;

  @ApiProperty({ type: [String], example: ['admin', 'developer'] })
  roles: string[];
}
