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
  replies?: PrismaQuackWithRelations[];
};

const mapPrismaQuackToDomain = (quack: PrismaQuackWithRelations): Quack => ({
  id: quack.id,
  text: quack.text,
  mood: quack.mood ?? null,
  userId: quack.userId,
  replyToId: quack.replyToId ?? null,
  deletedAt: quack.deletedAt ?? null,
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
  replies: quack.replies
    ? quack.replies.map(mapPrismaQuackToDomain)
    : undefined,
});

@Injectable()
export class QuackRepository {
  constructor(private readonly prisma: PrismaService) {}

  private getRepliesInclude(currentUserId?: string): {
    include: Record<string, unknown>;
    orderBy: { createdAt: 'asc' };
  } {
    return {
      include: {
        user: true,
        poll: {
          include: {
            options: {
              orderBy: { order: 'asc' as const },
              include: { _count: { select: { votes: true } } },
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
        replies: {
          include: {
            user: true,
            poll: {
              include: {
                options: {
                  orderBy: { order: 'asc' as const },
                  include: { _count: { select: { votes: true } } },
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
          orderBy: { createdAt: 'asc' as const },
        },
      },
      orderBy: { createdAt: 'asc' as const },
    };
  }

  async getQuacks(
    q?: string,
    currentUserId?: string,
    mine?: boolean,
  ): Promise<Quack[]> {
    const trimmedQuery = q?.trim();
    const searchFilter = trimmedQuery
      ? {
          deletedAt: null,
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
      ...(mine && currentUserId
        ? { userId: currentUserId, deletedAt: null }
        : {}),
      ...(!searchFilter
        ? {
            replyToId: null,
            ...(!mine
              ? {
                  OR: [{ deletedAt: null }, { replies: { some: {} } }],
                }
              : {}),
          }
        : {}),
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
        replies: this.getRepliesInclude(currentUserId),
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
        replies: this.getRepliesInclude(),
      },
    })) as PrismaQuackWithRelations | null;

    if (!quack) {
      return null;
    }

    return mapPrismaQuackToDomain(quack);
  }

  async deleteQuack(id: string): Promise<void> {
    const quack = await this.prisma.quack.findUnique({
      where: { id },
      include: {
        _count: { select: { replies: true } },
      },
    });

    if (!quack) {
      return;
    }

    if (quack._count.replies > 0) {
      // Tombstone: has replies, scrub content and set deletedAt
      await this.prisma.$transaction([
        this.prisma.poll.deleteMany({ where: { quackId: id } }),
        this.prisma.quack.update({
          where: { id },
          data: {
            text: '',
            mood: null,
            deletedAt: new Date(),
          },
        }),
      ]);
    } else {
      // Hard delete: no replies
      const parentId = quack.replyToId;
      await this.prisma.quack.delete({
        where: { id },
      });

      // If parent was a tombstone and now has no replies left, clean up parent
      if (parentId) {
        const parent = await this.prisma.quack.findUnique({
          where: { id: parentId },
          include: { _count: { select: { replies: true } } },
        });
        if (parent && parent.deletedAt && parent._count.replies === 0) {
          await this.prisma.quack.delete({
            where: { id: parentId },
          });
        }
      }
    }
  }

  async createQuack(createQuackData: {
    text: string;
    mood?: string | null;
    userId: string;
    replyToId?: string | null;
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
        ...(createQuackData.replyToId
          ? { replyTo: { connect: { id: createQuackData.replyToId } } }
          : {}),
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
        replies: this.getRepliesInclude(createQuackData.userId),
      },
    })) as PrismaQuackWithRelations;

    return mapPrismaQuackToDomain(quack);
  }
}
