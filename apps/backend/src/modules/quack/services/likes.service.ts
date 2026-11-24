/* eslint-disable @typescript-eslint/no-unused-vars -- stub until likes are implemented */
import { LikeSummary } from '@/modules/quack/domain/like';
import { LikeRepository } from '@/modules/quack/repositories/like.repository';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable } from '@nestjs/common';

// Stub — see cases.md and docs/adr/0002-likes.md.
@Injectable()
export class LikesService {
  constructor(
    private readonly quackRepository: QuackRepository,
    private readonly likeRepository: LikeRepository,
  ) {}

  async like(_user: Identity, _quackId: string): Promise<LikeSummary> {
    throw new Error('not implemented');
  }

  async unlike(_user: Identity, _quackId: string): Promise<LikeSummary> {
    throw new Error('not implemented');
  }
}
