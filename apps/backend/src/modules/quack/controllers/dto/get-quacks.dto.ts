import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetQuacksDto {
  @ApiPropertyOptional({
    description:
      'Search query to filter quacks by text or author name/username',
    example: 'crumb',
  })
  @IsOptional()
  @IsString()
  q?: string;
}
