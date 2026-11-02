import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { PaymentsSpikeController } from './payments-spike.controller';
import { PaymentsSpikeService } from './payments-spike.service';

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [PaymentsSpikeController],
  providers: [PaymentsSpikeService],
  exports: [PaymentsSpikeService],
})
export class PaymentsModule {}