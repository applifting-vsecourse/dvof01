/* eslint-disable @typescript-eslint/no-unused-vars -- stub until likes are implemented */
import { PrismaService } from '@/core/prisma/prisma.service';
import { LikeSummary } from '@/modules/quack/domain/like';
import { Injectable } from '@nestjs/common';

// Stub — see cases.md and docs/adr/0002-likes.md.
@Injectable()
export class LikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Stores one like of `userId` on `quackId`; liking again is a no-op. */
  async like(_quackId: string, _userId: string): Promise<void> {
    throw new Error('not implemented');
  }

  /** Removes the like of `userId` on `quackId`, if there is one. */
  async unlike(_quackId: string, _userId: string): Promise<void> {
    throw new Error('not implemented');
  }

  /** Like count of `quackId` and whether `userId` likes it. */
  async getSummary(_quackId: string, _userId: string): Promise<LikeSummary> {
    throw new Error('not implemented');
  }
}
