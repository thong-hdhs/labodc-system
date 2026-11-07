import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReportsModule } from '../reports/reports.module';
import { TalentModule } from '../talent/talent.module';
import { TasksModule } from '../tasks/tasks.module';
import { TeamsModule } from '../teams/teams.module';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import {
  FILE_REPOSITORY,
  PostgresFileRepository,
} from './file.repository';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [
    AuthModule,
    ReportsModule,
    TalentModule,
    TasksModule,
    TeamsModule,
  ],
  controllers: [FilesController],
  providers: [
    CloudinaryStorageService,
    PostgresFileRepository,
    FilesService,
    {
      provide: FILE_REPOSITORY,
      useExisting: PostgresFileRepository,
    },
  ],
  exports: [FilesService],
})
export class FilesModule {}
