import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '../../projects/entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({ example: 'Prepare launch checklist', minLength: 3 })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({ example: 'Coordinate final release readiness.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.Todo })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, example: TaskPriority.High })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: 'dfd2bdbc-fc8d-42e4-a56c-3af84341921d' })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({
    example: '2026-06-01T12:00:00.000Z',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @ApiProperty({ type: [String], example: ['release', 'blocked-by-legal'] })
  @IsArray()
  @ArrayMaxSize(16)
  labels: string[];
}
