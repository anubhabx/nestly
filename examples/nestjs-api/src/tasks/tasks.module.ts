import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksController } from './tasks.controller';

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [TasksController],
})
export class TasksModule {}
