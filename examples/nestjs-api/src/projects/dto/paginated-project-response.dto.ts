import { ApiProperty } from '@nestjs/swagger';
import { ProjectResponseDto } from './project-response.dto';

export class ProjectPageMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 87 })
  total: number;
}

export class PaginatedProjectResponseDto {
  @ApiProperty({ type: () => [ProjectResponseDto] })
  items: ProjectResponseDto[];

  @ApiProperty({ type: () => ProjectPageMetaDto })
  meta: ProjectPageMetaDto;
}
