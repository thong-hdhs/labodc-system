import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TalentModule } from './talent/talent.module';

@Module({
  imports: [AuthModule, TalentModule],
})
export class AppModule {}