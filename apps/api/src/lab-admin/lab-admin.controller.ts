import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, ProjectStatus, UserRole } from '@labodc/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { ChangeRequestStatus } from '../projects/project-proposal.types';
import { LabAdminService } from './lab-admin.service';
import {
  ApproveChangeRequestDto,
  ApproveProposalDto,
  LifecycleNoteDto,
  PublishProjectDto,
  RejectChangeRequestDto,
  ReviewDecisionWithReasonDto,
} from './lab-admin.types';

@Controller('api/v1/lab-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
export class LabAdminController {
  constructor(private readonly labAdminService: LabAdminService) {}

  @Get('proposals')
  listProposalsQueue(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: ProjectStatus,
  ) {
    return this.labAdminService.listReviewQueue(user, status);
  }

  @Get('proposals/:id')
  getProposalDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.labAdminService.getProposalReviewDetail(user, id);
  }

  @Post('proposals/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveProposal(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto?: ApproveProposalDto,
  ) {
    return this.labAdminService.approveProposal(user, id, dto);
  }

  @Post('proposals/:id/request-info')
  @HttpCode(HttpStatus.OK)
  requestMoreInfo(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewDecisionWithReasonDto,
  ) {
    return this.labAdminService.requestChanges(user, id, dto);
  }

  @Post('proposals/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectProposal(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReviewDecisionWithReasonDto,
  ) {
    return this.labAdminService.rejectProposal(user, id, dto);
  }

  @Post('projects/:id/publish')
  @HttpCode(HttpStatus.OK)
  publishProject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: PublishProjectDto,
  ) {
    return this.labAdminService.publishProject(user, id, dto);
  }

  @Post('projects/:id/unpublish')
  @HttpCode(HttpStatus.OK)
  unpublishProject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto?: LifecycleNoteDto,
  ) {
    return this.labAdminService.unpublishProject(user, id, dto);
  }

  @Post('projects/:id/close-recruitment')
  @HttpCode(HttpStatus.OK)
  closeRecruitment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto?: LifecycleNoteDto,
  ) {
    return this.labAdminService.closeRecruitment(user, id, dto);
  }

  @Post('projects/:id/start-progress')
  @HttpCode(HttpStatus.OK)
  startProjectProgress(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto?: LifecycleNoteDto,
  ) {
    return this.labAdminService.startProjectProgress(user, id, dto);
  }

  /**
   * REQ-LAB-02 (Ngày D11): Quản lý & Phê duyệt Yêu cầu Đổi phạm vi / Hủy dự án
   */
  @Get('change-requests')
  listChangeRequests(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: ChangeRequestStatus,
  ) {
    return this.labAdminService.listChangeRequestsQueue(user, status);
  }

  @Post('change-requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveChangeRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') requestId: string,
    @Body() dto?: ApproveChangeRequestDto,
  ) {
    return this.labAdminService.approveChangeRequest(user, requestId, dto);
  }

  @Post('change-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectChangeRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') requestId: string,
    @Body() dto: RejectChangeRequestDto,
  ) {
    return this.labAdminService.rejectChangeRequest(user, requestId, dto);
  }
}