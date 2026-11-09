import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectsService } from '../projects/projects.service';

export interface TalentProjectDiscoveryQuery {
  keyword?: unknown;
  skill?: unknown;
  page?: unknown;
  pageSize?: unknown;
}

@Injectable()
export class TalentDiscoveryService {
  constructor(private readonly projects: ProjectsService) {}

  listProjects(query: TalentProjectDiscoveryQuery) {
    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const pageSize = this.parsePositiveInteger(query.pageSize, 20, 'pageSize');
    if (pageSize > 50) {
      throw new BadRequestException('pageSize phải nằm trong khoảng 1 đến 50.');
    }

    const keyword = this.normalizeFilter(query.keyword, 'keyword', 100);
    const skill = this.normalizeFilter(query.skill, 'skill', 80);
    const eligibleProjects = this.projects
      .listPublicPublishedProjects({ keyword, skill })
      .filter(
        (project) =>
          this.projects.checkRecruitmentEligibility(project.id)
            .isOpenForApplications,
      );

    const totalItems = eligibleProjects.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    if (!Number.isSafeInteger(start)) {
      throw new BadRequestException('page nằm ngoài phạm vi cho phép.');
    }
    return {
      items: eligibleProjects.slice(start, start + pageSize),
      pagination: {
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
      },
    };
  }

  getProjectDetail(projectId: string) {
    const eligibility = this.projects.checkRecruitmentEligibility(projectId);
    if (!eligibility.isOpenForApplications) {
      throw new NotFoundException('Dự án không tồn tại hoặc hiện không nhận đơn.');
    }
    return this.projects.getPublicProjectById(projectId);
  }

  private normalizeFilter(
    value: unknown,
    fieldName: string,
    maxLength: number,
  ): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} chỉ nhận một giá trị.`);
    }
    const normalized = value.trim();
    if (normalized.length > maxLength) {
      throw new BadRequestException(
        `${fieldName} không được vượt quá ${maxLength} ký tự.`,
      );
    }
    return normalized || undefined;
  }

  private parsePositiveInteger(
    value: unknown,
    defaultValue: number,
    fieldName: string,
  ): number {
    if (value === undefined) return defaultValue;
    if (typeof value !== 'string') {
      throw new BadRequestException(`${fieldName} chỉ nhận một giá trị.`);
    }
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException(`${fieldName} phải là số nguyên dương.`);
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed)) {
      throw new BadRequestException(`${fieldName} nằm ngoài phạm vi cho phép.`);
    }
    return parsed;
  }
}
