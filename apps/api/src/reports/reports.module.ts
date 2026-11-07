import { Module } from '@nestjs/common';
import { ApplicationsModule } from '../applications/applications.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { TeamsModule } from '../teams/teams.module';
import { ReportRepository } from './report.repository';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [ApplicationsModule, AuthModule, ProjectsModule, TeamsModule],
  controllers: [ReportsController],
  providers: [ReportRepository, ReportsService],
  exports: [ReportRepository, ReportsService],
})
export class ReportsModule {}
