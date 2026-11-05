import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TeamsModule } from '../teams/teams.module';
import { TaskRepository } from './task.repository';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [AuthModule, TeamsModule],
  controllers: [TasksController],
  providers: [TaskRepository, TasksService],
  exports: [TaskRepository, TasksService],
})
export class TasksModule {}
