import {
  ApiProperty,
  ApiPropertyOptional,
  ApiResponseProperty,
} from '@nestjs/swagger';
import { ProjectStatus } from '../entities/project.entity';
import { TaskResponseDto } from '../../tasks/dto/task-response.dto';

export class ProjectResponseDto {
  @ApiResponseProperty({ example: '88dd40e4-ff7f-4c85-ae90-13b0519226d2' })
  id: string;

  @ApiProperty({ example: '6fbe8f9b-1d51-42a5-bfac-fb9a87113d2b' })
  accountId: string;

  @ApiProperty({ example: 'dfd2bdbc-fc8d-42e4-a56c-3af84341921d' })
  ownerId: string;

  @ApiProperty({ example: 'Mobile Launch' })
  name: string;

  @ApiProperty({ example: 'mobile-launch' })
  slug: string;

  @ApiPropertyOptional({ example: 'Customer-facing launch plan.' })
  description?: string;

  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.Active })
  status: ProjectStatus;

  @ApiProperty({ type: [String], example: ['mobile', 'q3'] })
  tags: string[];

  @ApiProperty({ example: { costCenter: 'growth' } })
  metadata: Record<string, unknown>;

  @ApiResponseProperty({
    example: '2026-05-16T09:30:00.000Z',
    format: 'date-time',
  })
  createdAt: string;

  @ApiPropertyOptional({ type: () => [TaskResponseDto] })
  tasks?: TaskResponseDto[];
}
