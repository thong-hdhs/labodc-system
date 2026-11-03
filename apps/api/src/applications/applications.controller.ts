import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApplicationsService } from './applications.service';

@Controller('api/v1')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('projects/:projectId/applications')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  @HttpCode(HttpStatus.CREATED)
  submit(
    @CurrentUser() user: JwtPayload,
    @Param('projectId') projectId: string,
  ) {
    return this.applicationsService.submit(user, projectId);
  }

  @Get('talent/me/applications')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  listMine(@CurrentUser() user: JwtPayload) {
    return this.applicationsService.listMine(user);
  }

  @Post('applications/:applicationId/withdraw')
  @Roles(UserRole.TALENT, UserRole.TALENT_LEADER)
  @HttpCode(HttpStatus.OK)
  withdraw(
    @CurrentUser() user: JwtPayload,
    @Param('applicationId') applicationId: string,
  ) {
    return this.applicationsService.withdraw(user, applicationId);
  }
}
