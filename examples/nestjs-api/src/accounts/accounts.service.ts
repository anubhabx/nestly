import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import {
  AccountMember,
  MembershipRole,
} from './entities/account-member.entity';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountDetailsDto } from './dto/account-details.dto';
import { AccountResponseDto } from './dto/account-response.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { User, UserStatus } from '../users/entities/user.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
    @InjectRepository(AccountMember)
    private readonly members: Repository<AccountMember>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async list(): Promise<AccountResponseDto[]> {
    const accounts = await this.accounts.find({ order: { createdAt: 'DESC' } });
    return accounts.map((account) => this.toAccountResponse(account));
  }

  async findDetails(accountId: string): Promise<AccountDetailsDto> {
    const account = await this.accounts.findOne({
      where: { id: accountId },
      relations: { members: { user: true }, projects: true },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return {
      ...this.toAccountResponse(account),
      projectCount: account.projects?.length ?? 0,
      members:
        account.members?.map((member) => this.toMemberResponse(member)) ?? [],
    };
  }

  async update(
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    await this.accounts.update(accountId, dto);
    const account = await this.accounts.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return this.toAccountResponse(account);
  }

  async invite(
    accountId: string,
    dto: InviteMemberDto,
    invitedByUserId: string,
  ): Promise<MemberResponseDto> {
    const account = await this.accounts.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const user =
      (await this.users.findOne({
        where: { email: dto.email.toLowerCase() },
      })) ??
      this.users.create({
        email: dto.email.toLowerCase(),
        name: dto.name ?? dto.email,
        passwordHash: 'pending-invitation',
        status: UserStatus.Invited,
        roles: ['developer'],
      });
    const savedUser = await this.users.save(user);
    const member = this.members.create({
      accountId,
      userId: savedUser.id,
      role: dto.role ?? MembershipRole.Viewer,
      invitedByUserId,
      user: savedUser,
    });
    return this.toMemberResponse(await this.members.save(member));
  }

  async removeMember(accountId: string, memberId: string): Promise<void> {
    const result = await this.members.delete({ id: memberId, accountId });
    if (!result.affected) {
      throw new NotFoundException('Member not found');
    }
  }

  private toAccountResponse(account: Account): AccountResponseDto {
    return {
      id: account.id,
      slug: account.slug,
      name: account.name,
      plan: account.plan,
      status: account.status,
      createdAt: account.createdAt.toISOString(),
    };
  }

  private toMemberResponse(member: AccountMember): MemberResponseDto {
    return {
      id: member.id,
      email: member.user?.email ?? member.userId,
      name: member.user?.name ?? 'Invited member',
      role: member.role,
      createdAt: member.createdAt.toISOString(),
    };
  }
}
