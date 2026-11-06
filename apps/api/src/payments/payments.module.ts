import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { PaymentsSpikeController } from './payments-spike.controller';
import { PaymentsSpikeService } from './payments-spike.service';
import { FinanceEscrowController } from './finance-escrow.controller';
import { FinanceEscrowService } from './finance-escrow.service';
import { ProjectSettlementController } from './project-settlement.controller';
import { ProjectSettlementService } from './project-settlement.service';

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [
    PaymentsSpikeController,
    FinanceEscrowController,
    ProjectSettlementController,
  ],
  providers: [
    PaymentsSpikeService,
    FinanceEscrowService,
    ProjectSettlementService,
  ],
  exports: [
    PaymentsSpikeService,
    FinanceEscrowService,
    ProjectSettlementService,
  ],
})
export class PaymentsModule {}