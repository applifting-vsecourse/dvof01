import { ApiProperty } from '@nestjs/swagger';

export class LikeResponseDto {
  @ApiProperty()
  quackId!: string;

  @ApiProperty()
  likeCount!: number;

  @ApiProperty()
  likedByMe!: boolean;
}
