import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../projects/entities/task.entity';

export class TaskQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.InProgress })
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

  @ApiPropertyOptional({ example: 'release' })
  @IsString()
  @IsOptional()
  label?: string;
}
