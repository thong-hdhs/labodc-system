import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  PostgresTalentProfileRepository,
  TALENT_PROFILE_REPOSITORY,
} from './talent-profile.repository';
import { TalentController } from './talent.controller';
import { TalentService } from './talent.service';

@Module({
  imports: [AuthModule],
  controllers: [TalentController],
  providers: [
    TalentService,
    PostgresTalentProfileRepository,
    {
      provide: TALENT_PROFILE_REPOSITORY,
      useExisting: PostgresTalentProfileRepository,
    },
  ],
})
export class TalentModule {}
