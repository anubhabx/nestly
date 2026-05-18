import { PickType } from '@nestjs/mapped-types';
import { ProjectResponseDto } from './project-response.dto';

export class ProjectSummaryDto extends PickType(ProjectResponseDto, [
  'id',
  'name',
  'status',
] as const) {}
