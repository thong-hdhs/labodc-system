import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TalentModule } from './talent/talent.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [AuthModule, TalentModule, EnterpriseModule, ProjectsModule],
})
export class AppModule {}