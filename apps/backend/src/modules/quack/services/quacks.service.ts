import { Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class QuacksService {
  constructor(private readonly quackRepository: QuackRepository) {}

  async getQuacks(
    q?: string,
    currentUserId?: string,
    mine?: boolean,
  ): Promise<Quack[]> {
    return this.quackRepository.getQuacks(q, currentUserId, mine);
  }

  async createQuack(
    user: Identity,
    quackData: {
      text: string;
      mood?: string | null;
      poll?: { options: string[] } | null;
    },
  ): Promise<Quack> {
    return this.quackRepository.createQuack({
      text: quackData.text,
      mood: quackData.mood ?? null,
      poll: quackData.poll ?? null,
      // the author is taken from the session, never from the request body
      userId: user.id,
    });
  }

  async deleteQuack(user: Identity, id: string): Promise<void> {
    const quack = await this.quackRepository.getQuackById(id);
    if (!quack) {
      throw new NotFoundException('Quack not found');
    }
    const isOwner = quack.userId === user.id;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own quacks');
    }
    await this.quackRepository.deleteQuack(id);
  }
}
