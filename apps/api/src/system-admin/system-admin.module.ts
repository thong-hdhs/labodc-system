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
import { PostGoliveHypercareController } from './post-golive-hypercare.controller';
import { PostGoliveHypercareService } from './post-golive-hypercare.service';
import { AcademicDefenseController } from './academic-defense.controller';
import { AcademicDefenseService } from './academic-defense.service';
import { MobilePhase2SyncController } from './mobile-phase2-sync.controller';
import { MobilePhase2SyncService } from './mobile-phase2-sync.service';
import { MobileEvaluationBridgeController } from './mobile-evaluation-bridge.controller';
import { MobileEvaluationBridgeService } from './mobile-evaluation-bridge.service';
import { CodeFreezeD27Controller } from './code-freeze-d27.controller';
import { CodeFreezeD27Service } from './code-freeze-d27.service';

@Module({
  imports: [AuthModule, EnterpriseModule, ProjectsModule, PaymentsModule],
  controllers: [
    SystemAdminController,
    SystemGovernanceController,
    ProductionReadinessController,
    ReleaseHandoverController,
    ProductionGoliveController,
    FinalArchivalController,
    PostGoliveHypercareController,
    AcademicDefenseController,
    MobilePhase2SyncController,
    MobileEvaluationBridgeController,
    CodeFreezeD27Controller,
  ],
  providers: [
    SystemAdminService,
    SystemGovernanceService,
    ProductionReadinessService,
    ReleaseHandoverService,
    ProductionGoliveService,
    FinalArchivalService,
    PostGoliveHypercareService,
    AcademicDefenseService,
    MobilePhase2SyncService,
    MobileEvaluationBridgeService,
    CodeFreezeD27Service,
  ],
  exports: [
    SystemAdminService,
    SystemGovernanceService,
    ProductionReadinessService,
    ReleaseHandoverService,
    ProductionGoliveService,
    FinalArchivalService,
    PostGoliveHypercareService,
    AcademicDefenseService,
    MobilePhase2SyncService,
    MobileEvaluationBridgeService,
    CodeFreezeD27Service,
  ],
})
export class SystemAdminModule {}