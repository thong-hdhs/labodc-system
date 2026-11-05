import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { TalentModule } from '../talent/talent.module';
import { ApplicationRepository } from './application.repository';
import { MentorAssignmentRepository } from './mentor-assignment.repository';
import { MentorInvitationRepository } from './mentor-invitation.repository';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [AuthModule, ProjectsModule, TalentModule],
  controllers: [ApplicationsController],
  providers: [
    ApplicationRepository,
    MentorAssignmentRepository,
    MentorInvitationRepository,
    ApplicationsService,
  ],
  exports: [ApplicationRepository, MentorAssignmentRepository],
})
export class ApplicationsModule {}
