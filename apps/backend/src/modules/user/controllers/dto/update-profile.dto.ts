import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const MOODS = ['happy', 'sad', 'angry', 'silly'] as const;

export class UpdateProfileDto {
  @ApiProperty({
    description:
      'New username (3–30 chars: letters, numbers, dots, underscores)',
    example: 'john_doe',
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9._]+$/, {
    message: 'Username may only contain letters, numbers, dots and underscores',
  })
  username!: string;

  @ApiProperty({
    description: 'Display name (required)',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName!: string;

  @ApiProperty({
    description: 'Short bio (optional, at most 160 characters)',
    example: 'Just a duck.',
    required: false,
    nullable: true,
    maxLength: 160,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  bio?: string | null;

  @ApiProperty({
    description: 'Default mood for new posts',
    example: 'happy',
    enum: MOODS,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsIn(MOODS)
  defaultMood?: string | null;
}
