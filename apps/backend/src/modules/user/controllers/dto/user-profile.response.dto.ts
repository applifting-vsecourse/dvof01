import { UserProfile } from '@/modules/user/domain/user';
import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  username!: string;

  @ApiProperty({ required: false, nullable: true })
  bio?: string | null;

  @ApiProperty({ required: false, nullable: true })
  defaultMood?: string | null;

  static fromDomain(user: UserProfile): UserProfileResponseDto {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      bio: user.bio ?? null,
      defaultMood: user.defaultMood ?? null,
    };
  }
}
