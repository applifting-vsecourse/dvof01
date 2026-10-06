import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateQuackDto {
  @ApiProperty({
    description: 'Body of the quack',
    example: 'Hello, world!',
    maxLength: 280,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  text!: string;

  @ApiProperty({
    description: 'Optional mood of the quack',
    example: 'happy',
    enum: ['happy', 'sad', 'angry', 'silly'],
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsIn(['happy', 'sad', 'angry', 'silly'])
  mood?: string | null;
}
