import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Poll as PrismaPoll,
  PollOption as PrismaPollOption,
  Quack as PrismaQuack,
  User as PrismaUser,
} from '@/generated/prisma/client';
import { Quack } from '@/modules/quack/domain/quack';
import { Injectable } from '@nestjs/common';

type PrismaQuackWithRelations = PrismaQuack & {
  user?: PrismaUser;
  poll?:
    | (PrismaPoll & {
        options?: (PrismaPollOption & {
          _count?: { votes: number };
        })[];
        votes?: { optionId: string }[];
        _count?: { votes: number };
      })
    | null;
};

const mapPrismaQuackToDomain = (quack: PrismaQuackWithRelations): Quack => ({
  id: quack.id,
  text: quack.text,
  mood: quack.mood ?? null,
  userId: quack.userId,
  createdAt: quack.createdAt,
  updatedAt: quack.updatedAt,
  user: quack.user
    ? {
        id: quack.user.id,
        name: quack.user.name,
        username: quack.user.username ?? '',
      }
    : undefined,
  poll: quack.poll
    ? {
        id: quack.poll.id,
        quackId: quack.poll.quackId,
        createdAt: quack.poll.createdAt,
        updatedAt: quack.poll.updatedAt,
        totalVotes: quack.poll._count?.votes ?? 0,
        userVotedOptionId: quack.poll.votes?.[0]?.optionId ?? null,
        options: (quack.poll.options ?? []).map((opt) => ({
          id: opt.id,
          text: opt.text,
          order: opt.order,
          voteCount: opt._count?.votes ?? 0,
        })),
      }
    : null,
});

@Injectable()
export class QuackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getQuacks(
    q?: string,
    currentUserId?: string,
    mine?: boolean,
  ): Promise<Quack[]> {
    const trimmedQuery = q?.trim();
    const searchFilter = trimmedQuery
      ? {
          OR: [
            { text: { contains: trimmedQuery, mode: 'insensitive' as const } },
            {
              user: {
                name: { contains: trimmedQuery, mode: 'insensitive' as const },
              },
            },
            {
              user: {
                username: {
                  contains: trimmedQuery,
                  mode: 'insensitive' as const,
                },
              },
            },
          ],
        }
      : undefined;

    const where = {
      ...(searchFilter ? searchFilter : {}),
      ...(mine && currentUserId ? { userId: currentUserId } : {}),
    };

    const quacks = (await this.prisma.quack.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        user: true,
        poll: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    })) as PrismaQuackWithRelations[];

    return quacks.map(mapPrismaQuackToDomain);
  }

  async getQuackById(id: string): Promise<Quack | null> {
    const quack = (await this.prisma.quack.findUnique({
      where: { id },
      include: {
        user: true,
      },
    })) as PrismaQuackWithRelations | null;

    if (!quack) {
      return null;
    }

    return mapPrismaQuackToDomain(quack);
  }

  async deleteQuack(id: string): Promise<void> {
    await this.prisma.quack.delete({
      where: { id },
    });
  }

  async createQuack(createQuackData: {
    text: string;
    mood?: string | null;
    userId: string;
    poll?: { options: string[] } | null;
  }): Promise<Quack> {
    const cleanOptions = createQuackData.poll?.options
      ?.map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    const quack = (await this.prisma.quack.create({
      data: {
        text: createQuackData.text,
        mood: createQuackData.mood ?? null,
        user: { connect: { id: createQuackData.userId } },
        ...(cleanOptions && cleanOptions.length >= 2
          ? {
              poll: {
                create: {
                  options: {
                    create: cleanOptions.map((text, index) => ({
                      text,
                      order: index,
                    })),
                  },
                },
              },
            }
          : {}),
      },
      include: {
        user: true,
        poll: {
          include: {
            options: {
              orderBy: { order: 'asc' },
              include: {
                _count: { select: { votes: true } },
              },
            },
            votes: {
              where: { userId: createQuackData.userId },
              select: { optionId: true },
            },
            _count: { select: { votes: true } },
          },
        },
      },
    })) as PrismaQuackWithRelations;

    return mapPrismaQuackToDomain(quack);
  }
}
