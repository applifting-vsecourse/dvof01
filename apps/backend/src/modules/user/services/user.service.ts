import { UserProfile } from '@/modules/user/domain/user';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { ConflictException, Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(user: Identity): Promise<UserProfile | null> {
    return this.userRepository.findById(user.id);
  }

  async updateProfile(
    user: Identity,
    data: {
      username: string;
      displayName: string;
      bio?: string | null;
      defaultMood?: string | null;
    },
  ): Promise<UserProfile> {
    const taken = await this.userRepository.isUsernameTaken(
      data.username,
      user.id,
    );
    if (taken) {
      throw new ConflictException('Username is already taken');
    }
    return this.userRepository.updateProfile(user.id, data);
  }
}
