// Rules for likes (cases.md, L1–L4). Repositories are mocked; the
// one-like-per-user guarantee itself lives in the database and is covered by
// the integration tests.
import { Quack } from '@/modules/quack/domain/quack';
import { LikeRepository } from '@/modules/quack/repositories/like.repository';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { NotFoundException } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { LikesService } from './likes.service';

const aQuack = (overrides: Partial<Quack> = {}): Quack => ({
  id: 'q1',
  text: 'quack quack',
  userId: 'author',
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  user: { id: 'author', name: 'Caffeinated Duck', username: 'CaffeinatedDuck' },
  ...overrides,
});

const setup = (
  quack: Quack | null = aQuack(),
): {
  service: LikesService;
  quackRepository: ReturnType<typeof mock<QuackRepository>>;
  likeRepository: ReturnType<typeof mock<LikeRepository>>;
} => {
  const quackRepository = mock<QuackRepository>();
  const likeRepository = mock<LikeRepository>();
  quackRepository.getQuackById.mockResolvedValue(quack);
  likeRepository.like.mockResolvedValue(undefined);
  likeRepository.unlike.mockResolvedValue(undefined);
  return {
    service: new LikesService(quackRepository, likeRepository),
    quackRepository,
    likeRepository,
  };
};

const user = { id: 'u1', role: 'user' } as Identity;

describe('LikesService', () => {
  describe('like', () => {
    it('L1: stores the like for the signed-in user and returns the summary', async () => {
      const { service, quackRepository, likeRepository } = setup();
      likeRepository.getSummary.mockResolvedValue({
        quackId: 'q1',
        likeCount: 1,
        likedByMe: true,
      });

      await expect(service.like(user, 'q1')).resolves.toEqual({
        quackId: 'q1',
        likeCount: 1,
        likedByMe: true,
      });
      expect(quackRepository.getQuackById).toHaveBeenCalledWith('q1');
      // the liker comes from the session, never from the request
      expect(likeRepository.like).toHaveBeenCalledWith('q1', 'u1');
      expect(likeRepository.getSummary).toHaveBeenCalledWith('q1', 'u1');
    });

    it('L3: throws NotFoundException for a quack that does not exist', async () => {
      const { service, likeRepository } = setup(null);

      await expect(service.like(user, 'missing')).rejects.toThrow(
        new NotFoundException('Quack not found'),
      );
      expect(likeRepository.like).not.toHaveBeenCalled();
    });

    it('L4: throws NotFoundException for a deleted quack (tombstone)', async () => {
      const { service, likeRepository } = setup(
        aQuack({ text: '', deletedAt: new Date('2026-01-02T12:00:00Z') }),
      );

      await expect(service.like(user, 'q1')).rejects.toThrow(NotFoundException);
      expect(likeRepository.like).not.toHaveBeenCalled();
    });
  });

  describe('unlike', () => {
    it('L2: removes the like of the signed-in user and returns the summary', async () => {
      const { service, quackRepository, likeRepository } = setup();
      likeRepository.getSummary.mockResolvedValue({
        quackId: 'q1',
        likeCount: 0,
        likedByMe: false,
      });

      await expect(service.unlike(user, 'q1')).resolves.toEqual({
        quackId: 'q1',
        likeCount: 0,
        likedByMe: false,
      });
      expect(quackRepository.getQuackById).toHaveBeenCalledWith('q1');
      expect(likeRepository.unlike).toHaveBeenCalledWith('q1', 'u1');
      expect(likeRepository.getSummary).toHaveBeenCalledWith('q1', 'u1');
    });

    it('L3: throws NotFoundException for a quack that does not exist', async () => {
      const { service, likeRepository } = setup(null);

      await expect(service.unlike(user, 'missing')).rejects.toThrow(
        new NotFoundException('Quack not found'),
      );
      expect(likeRepository.unlike).not.toHaveBeenCalled();
    });

    it('L4: throws NotFoundException for a deleted quack (tombstone)', async () => {
      const { service, likeRepository } = setup(
        aQuack({ text: '', deletedAt: new Date('2026-01-02T12:00:00Z') }),
      );

      await expect(service.unlike(user, 'q1')).rejects.toThrow(
        NotFoundException,
      );
      expect(likeRepository.unlike).not.toHaveBeenCalled();
    });
  });
});
