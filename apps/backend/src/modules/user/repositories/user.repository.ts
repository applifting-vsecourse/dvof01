import { PrismaService } from '@/core/prisma/prisma.service';
import { UserProfile } from '@/modules/user/domain/user';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      username: user.username ?? '',
      bio: user.bio ?? null,
      defaultMood: user.defaultMood ?? null,
    };
  }

  async isUsernameTaken(
    username: string,
    excludeUserId: string,
  ): Promise<boolean> {
    const existing = await this.prisma.user.findFirst({
      where: {
        username: { equals: username, mode: 'insensitive' },
        NOT: { id: excludeUserId },
      },
    });
    return existing !== null;
  }

  async updateProfile(
    userId: string,
    data: {
      username: string;
      displayName: string;
      bio?: string | null;
      defaultMood?: string | null;
    },
  ): Promise<UserProfile> {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.displayName,
        // better-auth stores canonical username in `username` and a
        // display-cased copy in `displayUsername`.
        username: data.username.toLowerCase(),
        displayUsername: data.username,
        ...(data.bio !== undefined ? { bio: data.bio ?? null } : {}),
        ...(data.defaultMood !== undefined
          ? { defaultMood: data.defaultMood ?? null }
          : {}),
      },
    });
    return {
      id: updated.id,
      name: updated.name,
      username: updated.displayUsername ?? updated.username ?? '',
      bio: updated.bio ?? null,
      defaultMood: updated.defaultMood ?? null,
    };
  }
}
