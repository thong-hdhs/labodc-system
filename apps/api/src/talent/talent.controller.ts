import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { CurrentUser, Roles, RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreatePortfolioItemInput, UpdateTalentProfileInput } from './talent-profile.types';
import { TalentService } from './talent.service';

const TALENT_ROLES = [UserRole.TALENT, UserRole.TALENT_LEADER] as const;

@Controller('api/v1/talent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TalentController {
  constructor(private readonly talentService: TalentService) {}

  @Get('me/profile')
  @Roles(...TALENT_ROLES)
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return { profile: await this.talentService.getMyProfile(user.sub) };
  }

  @Put('me/profile')
  @Roles(...TALENT_ROLES)
  updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() input: UpdateTalentProfileInput,
  ) {
    return this.talentService.updateMyProfile(user.sub, user.email, input);
  }

  @Post('me/portfolio')
  @Roles(...TALENT_ROLES)
  addPortfolioItem(
    @CurrentUser() user: JwtPayload,
    @Body() input: CreatePortfolioItemInput,
  ) {
    return this.talentService.addPortfolioItem(user.sub, input);
  }

  @Get('profiles/:userId')
  @Roles(UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN)
  getProfileForLabAdmin(@Param('userId') userId: string) {
    return this.talentService.getProfileForLabAdmin(userId);
  }
}
