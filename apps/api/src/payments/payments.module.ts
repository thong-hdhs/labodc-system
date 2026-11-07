import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { PaymentsSpikeController } from './payments-spike.controller';
import { PaymentsSpikeService } from './payments-spike.service';
import { FinanceEscrowController } from './finance-escrow.controller';
import { FinanceEscrowService } from './finance-escrow.service';
import { ProjectSettlementController } from './project-settlement.controller';
import { ProjectSettlementService } from './project-settlement.service';
import { TeamPayoutController } from './team-payout.controller';
import { TeamPayoutService } from './team-payout.service';
import { FinancialClosureController } from './financial-closure.controller';
import { FinancialClosureService } from './financial-closure.service';

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [
    PaymentsSpikeController,
    FinanceEscrowController,
    ProjectSettlementController,
    TeamPayoutController,
    FinancialClosureController,
  ],
  providers: [
    PaymentsSpikeService,
    FinanceEscrowService,
    ProjectSettlementService,
    TeamPayoutService,
    FinancialClosureService,
  ],
  exports: [
    PaymentsSpikeService,
    FinanceEscrowService,
    ProjectSettlementService,
    TeamPayoutService,
    FinancialClosureService,
  ],
})
export class PaymentsModule {}