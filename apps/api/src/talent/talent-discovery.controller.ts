import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  TalentDiscoveryService,
  TalentProjectDiscoveryQuery,
} from './talent-discovery.service';

@Controller('api/v1/talent/discovery/projects')
export class TalentDiscoveryController {
  constructor(private readonly discovery: TalentDiscoveryService) {}

  @Get()
  listProjects(@Query() query: TalentProjectDiscoveryQuery) {
    return this.discovery.listProjects(query);
  }

  @Get(':projectId')
  getProjectDetail(@Param('projectId') projectId: string) {
    return this.discovery.getProjectDetail(projectId);
  }
}
