import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { TeamRepository } from './team.repository';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
  imports: [ApplicationsModule, AuthModule, ProjectsModule],
  controllers: [TeamsController],
  providers: [TeamRepository, TeamsService],
  exports: [TeamRepository, TeamsService],
})
export class TeamsModule {}
