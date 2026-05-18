import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

export enum BillingInterval {
  Month = 'month',
  Year = 'year',
}

export enum SubscriptionStatus {
  Trialing = 'trialing',
  Active = 'active',
  PastDue = 'past_due',
  Canceled = 'canceled',
}

@Entity({ name: 'subscriptions' })
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  accountId: string;

  @Column()
  planCode: string;

  @Column({
    type: 'enum',
    enum: BillingInterval,
    default: BillingInterval.Month,
  })
  interval: BillingInterval;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.Trialing,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp with time zone' })
  currentPeriodEnd: Date;

  @ManyToOne(() => Account, (account) => account.subscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
