import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';
import {
  PostgresTalentProfileRepository,
  TALENT_PROFILE_REPOSITORY,
} from './talent-profile.repository';
import { TalentController } from './talent.controller';
import { TalentDiscoveryController } from './talent-discovery.controller';
import { TalentDiscoveryService } from './talent-discovery.service';
import { TalentService } from './talent.service';

@Module({
  imports: [AuthModule, ProjectsModule],
  controllers: [TalentController, TalentDiscoveryController],
  providers: [
    TalentDiscoveryService,
    TalentService,
    PostgresTalentProfileRepository,
    {
      provide: TALENT_PROFILE_REPOSITORY,
      useExisting: PostgresTalentProfileRepository,
    },
  ],
  exports: [TalentService],
})
export class TalentModule {}
