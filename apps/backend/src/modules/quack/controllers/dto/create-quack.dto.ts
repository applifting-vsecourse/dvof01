import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreatePollDto {
  @ApiProperty({
    description: 'Answer choices for the poll (2 to 10 options)',
    example: ['Pizza', 'Sushi', 'Burgers'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(2, { message: 'A poll must have at least 2 options' })
  @ArrayMaxSize(10, { message: 'A poll can have at most 10 options' })
  @IsString({ each: true })
  @IsNotEmpty({ each: true, message: 'Poll options cannot be empty' })
  @MaxLength(100, {
    each: true,
    message: 'Each option can be at most 100 characters',
  })
  options!: string[];
}

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

  @ApiPropertyOptional({
    description: 'Optional poll attached to the quack',
    type: CreatePollDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll?: CreatePollDto | null;
}
