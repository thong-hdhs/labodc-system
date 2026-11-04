import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { ProjectsService } from './projects.service';
import {
  CreateProjectChangeRequestDto,
  CreateProjectProposalDto,
  UpdateProjectProposalDto,
} from './project-proposal.types';

@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * Public/Shared Read Contract cho Sinh viên B (REQ-TAL-02: Tìm kiếm & Lọc dự án PUBLISHED)
   */
  @Get('public')
  listPublicProjects(
    @Query('keyword') keyword?: string,
    @Query('skill') skill?: string,
  ) {
    return this.projectsService.listPublicPublishedProjects({ keyword, skill });
  }

  @Get('public/:id')
  getPublicProjectDetail(@Param('id') id: string) {
    return this.projectsService.getPublicProjectById(id);
  }

  /**
   * Shared Guard Contract cho Sinh viên B kiểm tra điều kiện nộp đơn ứng tuyển (D9)
   */
  @Get(':id/recruitment-eligibility')
  checkRecruitmentEligibility(@Param('id') id: string) {
    return this.projectsService.checkRecruitmentEligibility(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE)
  @Post('proposals')
  @HttpCode(HttpStatus.CREATED)
  createDraftProposal(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateProjectProposalDto,
  ) {
    return this.projectsService.createDraftProposal(user, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE)
  @Get('proposals/me')
  listMyProposals(@CurrentUser() user: JwtPayload) {
    return this.projectsService.listMyProposals(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @Get('proposals/:id')
  getProposalDetail(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.projectsService.getProposalDetail(user, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE)
  @Patch('proposals/:id')
  updateProposal(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProjectProposalDto,
  ) {
    return this.projectsService.updateProposal(user, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE)
  @Post('proposals/:id/submit')
  @HttpCode(HttpStatus.OK)
  submitProposal(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.projectsService.submitProposal(user, id);
  }

  /**
   * REQ-ENT-03 (Ngày D11): Doanh nghiệp gửi yêu cầu Đổi phạm vi (SCOPE_CHANGE) hoặc Hủy dự án (CANCEL)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE)
  @Post(':id/change-requests')
  @HttpCode(HttpStatus.CREATED)
  createChangeRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') projectId: string,
    @Body() dto: CreateProjectChangeRequestDto,
  ) {
    return this.projectsService.createChangeRequest(user, projectId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE)
  @Get('change-requests/me')
  listMyChangeRequests(@CurrentUser() user: JwtPayload) {
    return this.projectsService.listMyChangeRequests(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE, UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  @Get(':id/change-requests')
  listProjectChangeRequests(
    @CurrentUser() user: JwtPayload,
    @Param('id') projectId: string,
  ) {
    return this.projectsService.listProjectChangeRequests(user, projectId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ENTERPRISE)
  @Post('change-requests/:requestId/withdraw')
  @HttpCode(HttpStatus.OK)
  withdrawChangeRequest(
    @CurrentUser() user: JwtPayload,
    @Param('requestId') requestId: string,
  ) {
    return this.projectsService.withdrawChangeRequest(user, requestId);
  }
}