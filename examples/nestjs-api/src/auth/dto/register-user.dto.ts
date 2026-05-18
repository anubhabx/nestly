import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({ example: 'ada@example.com', format: 'email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ada Lovelace', minLength: 2 })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'correct horse battery staple', minLength: 12 })
  @IsString()
  @MinLength(12)
  password: string;

  @ApiPropertyOptional({ example: 'acme' })
  @IsString()
  @IsOptional()
  accountSlug?: string;
}
