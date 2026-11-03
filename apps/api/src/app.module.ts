import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TalentModule } from './talent/talent.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { ProjectsModule } from './projects/projects.module';
import { LabAdminModule } from './lab-admin/lab-admin.module';
import { PaymentsModule } from './payments/payments.module';
import { ApplicationsModule } from './applications/applications.module';
import { SystemAdminModule } from './system-admin/system-admin.module';

@Module({
  imports: [
    AuthModule,
    TalentModule,
    EnterpriseModule,
    ProjectsModule,
    LabAdminModule,
    PaymentsModule,
    ApplicationsModule,
    SystemAdminModule,
  ],
})
export class AppModule {}