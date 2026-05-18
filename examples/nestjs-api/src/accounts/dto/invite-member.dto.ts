import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { MembershipRole } from '../entities/account-member.entity';

export class InviteMemberDto {
  @ApiProperty({ example: 'grace@example.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'Grace Hopper' })
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: MembershipRole, example: MembershipRole.Developer })
  @IsEnum(MembershipRole)
  role: MembershipRole;
}
