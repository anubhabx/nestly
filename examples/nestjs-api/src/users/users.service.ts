import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { UserProfileDto } from '../auth/dto/user-profile.dto';
import {
  Account,
  AccountPlan,
  AccountStatus,
} from '../accounts/entities/account.entity';
import {
  AccountMember,
  MembershipRole,
} from '../accounts/entities/account-member.entity';
import { User, UserStatus } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
  ) {}

  async create(dto: RegisterUserDto): Promise<User> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const accountSlug = this.toSlug(dto.accountSlug ?? `${dto.name}-workspace`);
    const existingAccount = await this.accounts.findOne({
      where: { slug: accountSlug },
    });
    if (existingAccount) {
      throw new ConflictException('Account slug is already in use');
    }

    return this.users.manager.transaction(async (manager) => {
      const user = await manager.save(
        User,
        manager.create(User, {
          email: dto.email.toLowerCase(),
          name: dto.name,
          passwordHash: this.hashPassword(dto.password),
          status: UserStatus.Active,
          roles: ['owner', 'developer'],
        }),
      );

      const account = await manager.save(
        Account,
        manager.create(Account, {
          slug: accountSlug,
          name: `${dto.name}'s workspace`,
          plan: AccountPlan.Free,
          status: AccountStatus.Active,
          metadata: {
            source: 'self_signup',
          },
        }),
      );

      await manager.save(
        AccountMember,
        manager.create(AccountMember, {
          accountId: account.id,
          userId: user.id,
          role: MembershipRole.Owner,
          account,
          user,
        }),
      );

      return user;
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email: email.toLowerCase() } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  verifyPassword(user: User, password: string): boolean {
    const expected = Buffer.from(user.passwordHash);
    const actual = Buffer.from(this.hashPassword(password));
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  }

  toProfile(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      roles: user.roles,
    };
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  private toSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
