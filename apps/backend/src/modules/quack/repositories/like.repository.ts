import { PrismaService } from '@/core/prisma/prisma.service';
import { LikeSummary } from '@/modules/quack/domain/like';
import { Injectable } from '@nestjs/common';

// One row per (user, quack), unique in the database — see docs/adr/0002-likes.md.
@Injectable()
export class LikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Stores one like of `userId` on `quackId`; liking again is a no-op. */
  async like(quackId: string, userId: string): Promise<void> {
    // INSERT … ON CONFLICT DO NOTHING: the unique index (userId, quackId)
    // makes concurrent double likes a no-op instead of a P2002 error.
    await this.prisma.like.createMany({
      data: [{ quackId, userId }],
      skipDuplicates: true,
    });
  }

  /** Removes the like of `userId` on `quackId`, if there is one. */
  async unlike(quackId: string, userId: string): Promise<void> {
    await this.prisma.like.deleteMany({ where: { quackId, userId } });
  }

  /** Like count of `quackId` and whether `userId` likes it. */
  async getSummary(quackId: string, userId: string): Promise<LikeSummary> {
    const [likeCount, mine] = await Promise.all([
      this.prisma.like.count({ where: { quackId } }),
      this.prisma.like.count({ where: { quackId, userId } }),
    ]);
    return { quackId, likeCount, likedByMe: mine > 0 };
  }
}
