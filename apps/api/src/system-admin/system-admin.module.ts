import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EnterpriseModule } from '../enterprise/enterprise.module';
import { ProjectsModule } from '../projects/projects.module';
import { PaymentsModule } from '../payments/payments.module';
import { SystemAdminController } from './system-admin.controller';
import { SystemAdminService } from './system-admin.service';
import { SystemGovernanceController } from './system-governance.controller';
import { SystemGovernanceService } from './system-governance.service';
import { ProductionReadinessController } from './production-readiness.controller';
import { ProductionReadinessService } from './production-readiness.service';
import { ReleaseHandoverController } from './release-handover.controller';
import { ReleaseHandoverService } from './release-handover.service';
import { ProductionGoliveController } from './production-golive.controller';
import { ProductionGoliveService } from './production-golive.service';
import { FinalArchivalController } from './final-archival.controller';
import { FinalArchivalService } from './final-archival.service';

@Module({
  imports: [AuthModule, EnterpriseModule, ProjectsModule, PaymentsModule],
  controllers: [
    SystemAdminController,
    SystemGovernanceController,
    ProductionReadinessController,
    ReleaseHandoverController,
    ProductionGoliveController,
    FinalArchivalController,
  ],
  providers: [
    SystemAdminService,
    SystemGovernanceService,
    ProductionReadinessService,
    ReleaseHandoverService,
    ProductionGoliveService,
    FinalArchivalService,
  ],
  exports: [
    SystemAdminService,
    SystemGovernanceService,
    ProductionReadinessService,
    ReleaseHandoverService,
    ProductionGoliveService,
    FinalArchivalService,
  ],
})
export class SystemAdminModule {}