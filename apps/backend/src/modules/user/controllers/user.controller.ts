import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserProfileResponseDto } from './dto/user-profile.response.dto';
import { UserService } from '@/modules/user/services/user.service';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  async getMe(@User() user: Identity): Promise<UserProfileResponseDto> {
    const profile = await this.userService.getProfile(user);
    if (!profile) {
      // This can't happen: the session already proves the user exists.
      throw new Error(`User ${user.id} not found`);
    }
    return UserProfileResponseDto.fromDomain(profile);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 409, description: 'Username is already taken' })
  async updateMe(
    @User() user: Identity,
    @Body() body: UpdateProfileDto,
  ): Promise<UserProfileResponseDto> {
    const updated = await this.userService.updateProfile(user, {
      username: body.username,
      displayName: body.displayName,
      bio: body.bio,
      defaultMood: body.defaultMood,
    });
    return UserProfileResponseDto.fromDomain(updated);
  }
}
