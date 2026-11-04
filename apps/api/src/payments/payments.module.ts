import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { PaymentsSpikeController } from './payments-spike.controller';
import { PaymentsSpikeService } from './payments-spike.service';
import { FinanceEscrowController } from './finance-escrow.controller';
import { FinanceEscrowService } from './finance-escrow.service';

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [PaymentsSpikeController, FinanceEscrowController],
  providers: [PaymentsSpikeService, FinanceEscrowService],
  exports: [PaymentsSpikeService, FinanceEscrowService],
})
export class PaymentsModule {}