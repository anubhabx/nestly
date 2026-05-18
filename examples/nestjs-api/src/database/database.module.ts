import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountMember } from '../accounts/entities/account-member.entity';
import { Account } from '../accounts/entities/account.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { Subscription } from '../billing/entities/subscription.entity';
import { Project } from '../projects/entities/project.entity';
import { TaskComment } from '../projects/entities/task-comment.entity';
import { Task } from '../projects/entities/task.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        synchronize: config.get<boolean>('database.synchronize'),
        autoLoadEntities: true,
        entities: [
          Account,
          AccountMember,
          Invoice,
          Project,
          Subscription,
          Task,
          TaskComment,
          User,
        ],
      }),
    }),
  ],
})
export class DatabaseModule {}
