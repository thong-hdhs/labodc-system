import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { ApplicationRepository } from './application.repository';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [ApplicationsController],
  providers: [ApplicationRepository, ApplicationsService],
})
export class ApplicationsModule {}
