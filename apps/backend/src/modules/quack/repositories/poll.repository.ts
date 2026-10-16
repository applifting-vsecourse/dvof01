import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Poll as PrismaPoll,
  PollOption as PrismaPollOption,
} from '@/generated/prisma/client';
import { Poll } from '@/modules/quack/domain/quack';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

type PrismaPollWithRelations = PrismaPoll & {
  options: (PrismaPollOption & {
    _count: { votes: number };
  })[];
  votes?: { optionId: string }[];
  _count: { votes: number };
};

@Injectable()
export class PollRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPollById(
    pollId: string,
    currentUserId?: string,
  ): Promise<Poll | null> {
    const poll = (await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { votes: true } },
          },
        },
        votes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { optionId: true },
            }
          : false,
        _count: { select: { votes: true } },
      },
    })) as PrismaPollWithRelations | null;

    if (!poll) return null;

    return {
      id: poll.id,
      quackId: poll.quackId,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      totalVotes: poll._count.votes,
      userVotedOptionId: poll.votes?.[0]?.optionId ?? null,
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        order: opt.order,
        voteCount: opt._count.votes,
      })),
    };
  }

  async vote(pollId: string, optionId: string, userId: string): Promise<Poll> {
    const pollExists = await this.prisma.poll.findUnique({
      where: { id: pollId },
    });
    if (!pollExists) {
      throw new NotFoundException('Poll not found');
    }

    const option = await this.prisma.pollOption.findUnique({
      where: {
        pollId_id: {
          pollId,
          id: optionId,
        },
      },
    });
    if (!option) {
      throw new BadRequestException(
        'Selected option does not belong to this poll',
      );
    }

    // Database unique constraint [userId, pollId] guarantees at most one vote per user per poll
    await this.prisma.pollVote.upsert({
      where: {
        userId_pollId: {
          userId,
          pollId,
        },
      },
      create: {
        pollId,
        optionId,
        userId,
      },
      update: {
        optionId,
      },
    });

    const updatedPoll = await this.getPollById(pollId, userId);
    if (!updatedPoll) {
      throw new NotFoundException('Poll not found');
    }
    return updatedPoll;
  }

  async retractVote(pollId: string, userId: string): Promise<Poll> {
    const pollExists = await this.prisma.poll.findUnique({
      where: { id: pollId },
    });
    if (!pollExists) {
      throw new NotFoundException('Poll not found');
    }

    await this.prisma.pollVote.deleteMany({
      where: {
        pollId,
        userId,
      },
    });

    const updatedPoll = await this.getPollById(pollId, userId);
    if (!updatedPoll) {
      throw new NotFoundException('Poll not found');
    }
    return updatedPoll;
  }
}
