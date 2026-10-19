import { Poll, Quack } from '@/modules/quack/domain/quack';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class QuackUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  username!: string;
}

export class PollOptionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty()
  voteCount!: number;
}

export class PollResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: [PollOptionResponseDto] })
  options!: PollOptionResponseDto[];

  @ApiProperty()
  totalVotes!: number;

  @ApiPropertyOptional({ nullable: true })
  userVotedOptionId?: string | null;

  static fromDomain(poll: Poll): PollResponseDto {
    return {
      id: poll.id,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        voteCount: opt.voteCount,
      })),
      totalVotes: poll.totalVotes,
      userVotedOptionId: poll.userVotedOptionId ?? null,
    };
  }
}

export class QuackResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty({ required: false, nullable: true })
  mood?: string | null;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: QuackUserDto })
  user!: QuackUserDto;

  @ApiPropertyOptional({ type: PollResponseDto, nullable: true })
  poll?: PollResponseDto | null;

  static fromDomain(quack: Quack): QuackResponseDto {
    if (!quack.user) {
      throw new Error(
        `QuackResponseDto.fromDomain expected quack.user to be loaded for quack ${quack.id}`,
      );
    }
    return {
      id: quack.id,
      text: quack.text,
      mood: quack.mood ?? null,
      userId: quack.userId,
      createdAt: quack.createdAt,
      user: {
        id: quack.user.id,
        name: quack.user.name,
        username: quack.user.username,
      },
      poll: quack.poll ? PollResponseDto.fromDomain(quack.poll) : null,
    };
  }
}
