import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountMember } from '../../accounts/entities/account-member.entity';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../projects/entities/task.entity';

export enum UserStatus {
  Invited = 'invited',
  Active = 'active',
  Locked = 'locked',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.Invited })
  status: UserStatus;

  @Column({ type: 'text', array: true, default: ['developer'] })
  roles: string[];

  @OneToMany(() => AccountMember, (membership) => membership.user)
  memberships: AccountMember[];

  @OneToMany(() => Project, (project) => project.owner)
  ownedProjects: Project[];

  @OneToMany(() => Task, (task) => task.assignee)
  assignedTasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
