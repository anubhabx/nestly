import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTaskCommentDto {
  @ApiProperty({ example: 'Release notes are approved.', minLength: 2 })
  @IsString()
  @MinLength(2)
  body: string;

  @ApiPropertyOptional({ example: { visibility: 'internal' } })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
