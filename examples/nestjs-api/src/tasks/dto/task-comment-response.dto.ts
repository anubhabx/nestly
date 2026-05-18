import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';

export class TaskCommentResponseDto {
  @ApiResponseProperty({ example: 'b847ea8e-4205-4845-b8f0-52b5eca94099' })
  id: string;

  @ApiProperty({ example: 'dfd2bdbc-fc8d-42e4-a56c-3af84341921d' })
  authorId: string;

  @ApiProperty({ example: 'Release notes are approved.' })
  body: string;

  @ApiProperty({ example: { visibility: 'internal' } })
  metadata: Record<string, unknown>;

  @ApiResponseProperty({
    example: '2026-05-16T09:30:00.000Z',
    format: 'date-time',
  })
  createdAt: string;
}
