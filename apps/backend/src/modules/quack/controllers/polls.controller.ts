import { PollResponseDto } from '@/modules/quack/controllers/dto/quack.response.dto';
import { VoteDto } from '@/modules/quack/controllers/dto/vote.dto';
import { PollsService } from '@/modules/quack/services/polls.service';
import { User } from '@/shared/auth/decorators/user.decorator';
import { Identity } from '@/shared/auth/domain/identity';
import { AuthenticatedUserGuard } from '@/shared/auth/guards/authenticated-user.guard';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Put,
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

@ApiTags('polls')
@Controller('polls')
@UseGuards(AuthenticatedUserGuard)
@ApiCookieAuth()
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Put(':pollId/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cast or change vote on a poll' })
  @ApiResponse({ status: 200, type: PollResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid option for poll' })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async vote(
    @Param('pollId') pollId: string,
    @Body() body: VoteDto,
    @User() user: Identity,
  ): Promise<PollResponseDto> {
    const poll = await this.pollsService.vote(pollId, body.optionId, user.id);
    return PollResponseDto.fromDomain(poll);
  }

  @Delete(':pollId/vote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retract vote from a poll' })
  @ApiResponse({ status: 200, type: PollResponseDto })
  @ApiResponse({ status: 401, description: 'Not signed in' })
  @ApiResponse({ status: 404, description: 'Poll not found' })
  async retractVote(
    @Param('pollId') pollId: string,
    @User() user: Identity,
  ): Promise<PollResponseDto> {
    const poll = await this.pollsService.retractVote(pollId, user.id);
    return PollResponseDto.fromDomain(poll);
  }
}
