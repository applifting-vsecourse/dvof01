import { Poll } from '@/modules/quack/domain/quack';
import { PollRepository } from '@/modules/quack/repositories/poll.repository';
import { mock } from 'jest-mock-extended';
import { PollsService } from './polls.service';

const aPoll = (overrides: Partial<Poll> = {}): Poll => ({
  id: 'p1',
  quackId: 'q1',
  options: [
    { id: 'opt1', text: 'Pizza', order: 0, voteCount: 1 },
    { id: 'opt2', text: 'Burger', order: 1, voteCount: 0 },
  ],
  totalVotes: 1,
  userVotedOptionId: 'opt1',
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  ...overrides,
});

describe('PollsService', () => {
  it('casts or switches a vote on a poll', async () => {
    const poll = aPoll();
    const repository = mock<PollRepository>();
    repository.vote.mockResolvedValue(poll);

    const service = new PollsService(repository);

    await expect(service.vote('p1', 'opt1', 'u1')).resolves.toEqual(poll);
    expect(repository.vote).toHaveBeenCalledWith('p1', 'opt1', 'u1');
  });

  it('retracts a vote from a poll', async () => {
    const poll = aPoll({
      totalVotes: 0,
      userVotedOptionId: null,
      options: [
        { id: 'opt1', text: 'Pizza', order: 0, voteCount: 0 },
        { id: 'opt2', text: 'Burger', order: 1, voteCount: 0 },
      ],
    });
    const repository = mock<PollRepository>();
    repository.retractVote.mockResolvedValue(poll);

    const service = new PollsService(repository);

    await expect(service.retractVote('p1', 'u1')).resolves.toEqual(poll);
    expect(repository.retractVote).toHaveBeenCalledWith('p1', 'u1');
  });
});
