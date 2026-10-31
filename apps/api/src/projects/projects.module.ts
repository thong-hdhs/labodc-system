import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EnterpriseModule } from '../enterprise/enterprise.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { ProjectProposalRepository } from './project-proposal.repository';

@Module({
  imports: [AuthModule, EnterpriseModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectProposalRepository],
  exports: [ProjectsService, ProjectProposalRepository],
})
export class ProjectsModule {}