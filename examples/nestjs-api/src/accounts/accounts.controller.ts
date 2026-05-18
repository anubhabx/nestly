import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountsService } from './accounts.service';
import { AccountDetailsDto } from './dto/account-details.dto';
import { AccountResponseDto } from './dto/account-response.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  @ApiOperation({ operationId: 'listAccounts', summary: 'List accounts' })
  @ApiOkResponse({
    description: 'Accounts returned.',
    type: [AccountResponseDto],
  })
  list(): Promise<AccountResponseDto[]> {
    return this.accounts.list();
  }

  @Get(':accountId')
  @ApiOperation({ operationId: 'getAccount', summary: 'Get account details' })
  @ApiParam({ name: 'accountId', format: 'uuid' })
  @ApiOkResponse({
    description: 'Account details returned.',
    type: AccountDetailsDto,
  })
  get(@Param('accountId') accountId: string): Promise<AccountDetailsDto> {
    return this.accounts.findDetails(accountId);
  }

  @Patch(':accountId')
  @Roles('admin', 'owner')
  @ApiOperation({ operationId: 'updateAccount', summary: 'Update account' })
  @ApiParam({ name: 'accountId', format: 'uuid' })
  @ApiOkResponse({ description: 'Account updated.', type: AccountResponseDto })
  update(
    @Param('accountId') accountId: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.accounts.update(accountId, dto);
  }

  @Post(':accountId/members')
  @Roles('admin', 'owner')
  @ApiOperation({ operationId: 'inviteMember', summary: 'Invite member' })
  @ApiParam({ name: 'accountId', format: 'uuid' })
  @ApiOkResponse({ description: 'Member invited.', type: MemberResponseDto })
  invite(
    @Param('accountId') accountId: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: RequestUser,
  ): Promise<MemberResponseDto> {
    return this.accounts.invite(accountId, dto, user.id);
  }

  @Delete(':accountId/members/:memberId')
  @Roles('admin', 'owner')
  @HttpCode(204)
  @ApiOperation({ operationId: 'removeMember', summary: 'Remove member' })
  @ApiParam({ name: 'accountId', format: 'uuid' })
  @ApiParam({ name: 'memberId', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Member removed.' })
  removeMember(
    @Param('accountId') accountId: string,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    return this.accounts.removeMember(accountId, memberId);
  }
}
