import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountMember } from './account-member.entity';
import { Project } from '../../projects/entities/project.entity';
import { Subscription } from '../../billing/entities/subscription.entity';

export enum AccountPlan {
  Free = 'free',
  Team = 'team',
  Enterprise = 'enterprise',
}

export enum AccountStatus {
  Active = 'active',
  Suspended = 'suspended',
  Closed = 'closed',
}

@Entity({ name: 'accounts' })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AccountPlan, default: AccountPlan.Free })
  plan: AccountPlan;

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.Active })
  status: AccountStatus;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @OneToMany(() => AccountMember, (member) => member.account)
  members: AccountMember[];

  @OneToMany(() => Project, (project) => project.account)
  projects: Project[];

  @OneToMany(() => Subscription, (subscription) => subscription.account)
  subscriptions: Subscription[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
