import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AccountPlan, AccountStatus } from '../entities/account.entity';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Acme Labs', minLength: 2 })
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: AccountPlan, example: AccountPlan.Enterprise })
  @IsEnum(AccountPlan)
  @IsOptional()
  plan?: AccountPlan;

  @ApiPropertyOptional({ enum: AccountStatus, example: AccountStatus.Active })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;
}
