import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { LabAdminController } from './lab-admin.controller';
import { LabAdminService } from './lab-admin.service';

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [LabAdminController],
  providers: [LabAdminService],
  exports: [LabAdminService],
})
export class LabAdminModule {}