import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Account } from './account.entity';
import { User } from '../../users/entities/user.entity';

export enum MembershipRole {
  Owner = 'owner',
  Admin = 'admin',
  Billing = 'billing',
  Developer = 'developer',
  Viewer = 'viewer',
}

@Entity({ name: 'account_members' })
@Unique(['accountId', 'userId'])
export class AccountMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: MembershipRole,
    default: MembershipRole.Viewer,
  })
  role: MembershipRole;

  @Column({ nullable: true })
  invitedByUserId?: string;

  @ManyToOne(() => Account, (account) => account.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
