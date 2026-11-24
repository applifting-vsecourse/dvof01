import { LikeSummary } from '@/modules/quack/domain/like';
import { LikeRepository } from '@/modules/quack/repositories/like.repository';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';

// Rules: cases.md (L1–L4). Data model: docs/adr/0002-likes.md.
@Injectable()
export class LikesService {
  constructor(
    private readonly quackRepository: QuackRepository,
    private readonly likeRepository: LikeRepository,
  ) {}

  async like(user: Identity, quackId: string): Promise<LikeSummary> {
    await this.assertLikeable(quackId);
    // the liker is taken from the session, never from the request
    await this.likeRepository.like(quackId, user.id);
    return this.likeRepository.getSummary(quackId, user.id);
  }

  async unlike(user: Identity, quackId: string): Promise<LikeSummary> {
    await this.assertLikeable(quackId);
    await this.likeRepository.unlike(quackId, user.id);
    return this.likeRepository.getSummary(quackId, user.id);
  }

  /** Unknown quacks and tombstones (ADR 0001) cannot be liked or unliked. */
  private async assertLikeable(quackId: string): Promise<void> {
    const quack = await this.quackRepository.getQuackById(quackId);
    if (!quack || quack.deletedAt) {
      throw new NotFoundException('Quack not found');
    }
  }
}
