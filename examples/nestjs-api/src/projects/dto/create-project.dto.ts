import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ProjectStatus } from '../entities/project.entity';

export class CreateProjectDto {
  @ApiProperty({ example: 'Mobile Launch', minLength: 3 })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ example: 'mobile-launch', pattern: '^[a-z0-9-]+$' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  slug: string;

  @ApiPropertyOptional({ example: 'Customer-facing launch plan.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ProjectStatus, example: ProjectStatus.Planning })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({ type: [String], example: ['mobile', 'q3'] })
  @IsArray()
  @ArrayMaxSize(12)
  tags: string[];

  @ApiPropertyOptional({ example: { costCenter: 'growth' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
