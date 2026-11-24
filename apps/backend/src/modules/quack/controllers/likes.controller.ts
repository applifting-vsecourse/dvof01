import { LikesService } from '@/modules/quack/services/likes.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LikeResponseDto } from './dto/like.response.dto';

@ApiTags('likes')
@Controller('quacks/:id/like')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Like a quack (idempotent)' })
  @ApiResponse({ status: 200, type: LikeResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Quack not found or deleted' })
  async like(
    @User() user: Identity,
    @Param('id') id: string,
  ): Promise<LikeResponseDto> {
    return this.likesService.like(user, id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Take a like back (idempotent)' })
  @ApiResponse({ status: 200, type: LikeResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Quack not found or deleted' })
  async unlike(
    @User() user: Identity,
    @Param('id') id: string,
  ): Promise<LikeResponseDto> {
    return this.likesService.unlike(user, id);
  }
}
