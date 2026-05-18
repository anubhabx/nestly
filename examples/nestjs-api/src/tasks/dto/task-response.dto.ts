import {
  ApiProperty,
  ApiPropertyOptional,
  ApiResponseProperty,
} from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '../../projects/entities/task.entity';
import { TaskCommentResponseDto } from './task-comment-response.dto';

export class TaskResponseDto {
  @ApiResponseProperty({ example: '6042a661-917e-4267-b0b1-271384c4aa7f' })
  id: string;

  @ApiProperty({ example: '88dd40e4-ff7f-4c85-ae90-13b0519226d2' })
  projectId: string;

  @ApiPropertyOptional({ example: 'dfd2bdbc-fc8d-42e4-a56c-3af84341921d' })
  assigneeId?: string;

  @ApiProperty({ example: 'Prepare launch checklist' })
  title: string;

  @ApiPropertyOptional({ example: 'Coordinate final release readiness.' })
  description?: string;

  @ApiProperty({ enum: TaskStatus, example: TaskStatus.InProgress })
  status: TaskStatus;

  @ApiProperty({ enum: TaskPriority, example: TaskPriority.High })
  priority: TaskPriority;

  @ApiPropertyOptional({
    example: '2026-06-01T12:00:00.000Z',
    format: 'date-time',
  })
  dueAt?: string;

  @ApiProperty({ type: [String], example: ['release', 'blocked-by-legal'] })
  labels: string[];

  @ApiPropertyOptional({ type: () => [TaskCommentResponseDto] })
  comments?: TaskCommentResponseDto[];

  @ApiResponseProperty({
    example: '2026-05-16T09:30:00.000Z',
    format: 'date-time',
  })
  createdAt: string;
}
