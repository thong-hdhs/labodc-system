import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { ProjectsService } from './projects.service';
import {
  CreateProjectProposalDto,
  UpdateProjectProposalDto,
} from './project-proposal.types';

@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * Public/Shared Read Contract cho Sinh viên B (REQ-TAL-02: Sinh viên khám phá dự án PUBLISHED)
   */
  @Get('public')
  listPublicProjects() {
    return this.projectsService.listPublicPublishedProjects();
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
}