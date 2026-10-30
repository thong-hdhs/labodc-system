import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';
import { EnterpriseProfileRepository } from './enterprise-profile.repository';

@Module({
  imports: [AuthModule],
  controllers: [EnterpriseController],
  providers: [EnterpriseService, EnterpriseProfileRepository],
  exports: [EnterpriseService, EnterpriseProfileRepository],
})
export class EnterpriseModule {}