import { Poll } from '@/modules/quack/domain/quack';
import { PollRepository } from '@/modules/quack/repositories/poll.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PollsService {
  constructor(private readonly pollRepository: PollRepository) {}

  async vote(pollId: string, optionId: string, userId: string): Promise<Poll> {
    return this.pollRepository.vote(pollId, optionId, userId);
  }

  async retractVote(pollId: string, userId: string): Promise<Poll> {
    return this.pollRepository.retractVote(pollId, userId);
  }
}
