import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateFileUploadIntentInput } from './file.types';
import { FilesService } from './files.service';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('files/upload-intents')
  @Roles(
    UserRole.TALENT,
    UserRole.TALENT_LEADER,
    UserRole.MENTOR,
    UserRole.LAB_ADMIN,
  )
  createUploadIntent(
    @CurrentUser() user: JwtPayload,
    @Body() input: CreateFileUploadIntentInput,
  ) {
    return this.files.createUploadIntent(user, input);
  }

  @Post('files/:fileId/complete')
  @Roles(
    UserRole.TALENT,
    UserRole.TALENT_LEADER,
    UserRole.MENTOR,
    UserRole.LAB_ADMIN,
  )
  completeUpload(
    @CurrentUser() user: JwtPayload,
    @Param('fileId') fileId: string,
  ) {
    return this.files.completeUpload(user, fileId);
  }

  @Get('talent/me/files')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  listMyProfileFiles(@CurrentUser() user: JwtPayload) {
    return this.files.listMyProfileFiles(user);
  }

  @Get('tasks/:taskId/files')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER, UserRole.MENTOR, UserRole.LAB_ADMIN)
  listTaskFiles(
    @CurrentUser() user: JwtPayload,
    @Param('taskId') taskId: string,
  ) {
    return this.files.listTaskFiles(user, taskId);
  }

  @Get('reports/:reportId/files')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER, UserRole.MENTOR, UserRole.LAB_ADMIN)
  listReportFiles(
    @CurrentUser() user: JwtPayload,
    @Param('reportId') reportId: string,
  ) {
    return this.files.listReportFiles(user, reportId);
  }

  @Get('files/:fileId/download')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER, UserRole.MENTOR, UserRole.LAB_ADMIN)
  getDownloadUrl(
    @CurrentUser() user: JwtPayload,
    @Param('fileId') fileId: string,
  ) {
    return this.files.getDownloadUrl(user, fileId);
  }
}
