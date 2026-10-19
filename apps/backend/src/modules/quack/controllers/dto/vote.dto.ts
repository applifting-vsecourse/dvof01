import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VoteDto {
  @ApiProperty({
    description: 'ID of the option to vote for',
    example: 'cuid12345',
  })
  @IsString()
  @IsNotEmpty()
  optionId!: string;
}
