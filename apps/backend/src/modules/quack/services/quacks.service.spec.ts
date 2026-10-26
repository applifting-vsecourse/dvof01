// Example unit test — the pattern to copy for your own services.
// The repository is mocked, so the test exercises the service in isolation.
import { Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { mock } from 'jest-mock-extended';
import { QuacksService } from './quacks.service';

const aQuack = (overrides: Partial<Quack> = {}): Quack => ({
  id: 'q1',
  text: 'quack quack',
  userId: 'u1',
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  user: { id: 'u1', name: 'Caffeinated Duck', username: 'CaffeinatedDuck' },
  ...overrides,
});

describe('QuacksService', () => {
  it('returns quacks from the repository', async () => {
    const quacks = [aQuack()];
    const repository = mock<QuackRepository>();
    repository.getQuacks.mockResolvedValue(quacks);

    const service = new QuacksService(repository);

    await expect(service.getQuacks()).resolves.toEqual(quacks);
    expect(repository.getQuacks).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
    );
  });

  it('passes search query q, currentUserId, and mine to repository', async () => {
    const quacks = [aQuack()];
    const repository = mock<QuackRepository>();
    repository.getQuacks.mockResolvedValue(quacks);

    const service = new QuacksService(repository);

    await expect(service.getQuacks('crumb', 'u1', true)).resolves.toEqual(
      quacks,
    );
    expect(repository.getQuacks).toHaveBeenCalledWith('crumb', 'u1', true);
  });

  it('creates a quack owned by the signed-in user with an optional poll', async () => {
    const created = aQuack({
      id: 'q2',
      text: 'hello',
      mood: 'happy',
      poll: {
        id: 'p1',
        quackId: 'q2',
        options: [
          { id: 'opt1', text: 'Yes', order: 0, voteCount: 0 },
          { id: 'opt2', text: 'No', order: 1, voteCount: 0 },
        ],
        totalVotes: 0,
        userVotedOptionId: null,
        createdAt: new Date('2026-01-01T12:00:00Z'),
        updatedAt: new Date('2026-01-01T12:00:00Z'),
      },
    });
    const repository = mock<QuackRepository>();
    repository.createQuack.mockResolvedValue(created);

    const service = new QuacksService(repository);
    const user = { id: 'u1' } as Identity;

    await expect(
      service.createQuack(user, {
        text: 'hello',
        mood: 'happy',
        poll: { options: ['Yes', 'No'] },
      }),
    ).resolves.toEqual(created);
    // the author comes from the session, not from the caller's payload
    expect(repository.createQuack).toHaveBeenCalledWith({
      text: 'hello',
      mood: 'happy',
      userId: 'u1',
      poll: { options: ['Yes', 'No'] },
    });
  });

  describe('deleteQuack', () => {
    it('deletes quack when user is the author', async () => {
      const quack = aQuack({ id: 'q1', userId: 'u1' });
      const repository = mock<QuackRepository>();
      repository.getQuackById.mockResolvedValue(quack);
      repository.deleteQuack.mockResolvedValue(undefined);

      const service = new QuacksService(repository);
      const user = { id: 'u1' } as Identity;

      await expect(service.deleteQuack(user, 'q1')).resolves.toBeUndefined();
      expect(repository.getQuackById).toHaveBeenCalledWith('q1');
      expect(repository.deleteQuack).toHaveBeenCalledWith('q1');
    });

    it('throws NotFoundException when quack does not exist', async () => {
      const repository = mock<QuackRepository>();
      repository.getQuackById.mockResolvedValue(null);

      const service = new QuacksService(repository);
      const user = { id: 'u1' } as Identity;

      await expect(service.deleteQuack(user, 'non-existent')).rejects.toThrow(
        'Quack not found',
      );
      expect(repository.deleteQuack).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not the author', async () => {
      const quack = aQuack({ id: 'q1', userId: 'other-user' });
      const repository = mock<QuackRepository>();
      repository.getQuackById.mockResolvedValue(quack);

      const service = new QuacksService(repository);
      const user = { id: 'u1' } as Identity;

      await expect(service.deleteQuack(user, 'q1')).rejects.toThrow(
        'You can only delete your own quacks',
      );
      expect(repository.deleteQuack).not.toHaveBeenCalled();
    });
  });
});
