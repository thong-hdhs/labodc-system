import { Injectable } from '@nestjs/common';
import { ProjectStatus, UserRole } from '@labodc/shared-types';
import {
  CreateProjectProposalDto,
  ProjectAuditLogEntity,
  ProjectProposalEntity,
  UpdateProjectProposalDto,
} from './project-proposal.types';

@Injectable()
export class ProjectProposalRepository {
  private readonly proposalsById = new Map<string, ProjectProposalEntity>();
  private readonly auditLogsByProjectId = new Map<
    string,
    ProjectAuditLogEntity[]
  >();
  private sequence = 1;
  private auditSequence = 1;

  createDraft(params: {
    ownerUserId: string;
    enterpriseId: string | null;
    companyName: string;
    dto: CreateProjectProposalDto;
  }): ProjectProposalEntity {
    const now = new Date().toISOString();
    const numericSeq = this.sequence++;
    const id = `proj-${numericSeq}`;
    const code = `ODC-2026-${String(numericSeq).padStart(3, '0')}`;

    const entity: ProjectProposalEntity = {
      id,
      code,
      enterpriseId: params.enterpriseId,
      companyName: params.companyName,
      ownerUserId: params.ownerUserId,
      title: params.dto.title.trim(),
      summary: params.dto.summary?.trim() || '',
      description: params.dto.description?.trim() || '',
      deliverables: params.dto.deliverables?.trim() || '',
      requiredSkills: Array.isArray(params.dto.requiredSkills)
        ? params.dto.requiredSkills.map((s) => s.trim()).filter(Boolean)
        : [],
      minTeamSize: params.dto.minTeamSize ?? 3,
      maxTeamSize: params.dto.maxTeamSize ?? 5,
      durationWeeks: params.dto.durationWeeks ?? 8,
      budgetAmount: params.dto.budgetAmount ?? 0,
      currency: 'VND',
      attachmentUrl: params.dto.attachmentUrl?.trim() || null,
      status: ProjectStatus.DRAFT,
      reasonCode: null,
      reviewNote: null,
      registrationOpenAt: null,
      registrationCloseAt: null,
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.proposalsById.set(id, entity);
    this.appendAuditLog({
      projectId: id,
      actorUserId: params.ownerUserId,
      actorRole: UserRole.ENTERPRISE,
      action: 'CREATE_DRAFT',
      fromStatus: null,
      toStatus: ProjectStatus.DRAFT,
      reasonNote: 'Doanh nghiệp khởi tạo bản nháp đề xuất dự án.',
    });

    return entity;
  }

  findById(id: string): ProjectProposalEntity | null {
    return this.proposalsById.get(id) ?? null;
  }

  findByOwnerUserId(ownerUserId: string): ProjectProposalEntity[] {
    const results: ProjectProposalEntity[] = [];
    for (const proposal of this.proposalsById.values()) {
      if (proposal.ownerUserId === ownerUserId) {
        results.push(proposal);
      }
    }
    return results;
  }

  findAll(statusFilter?: ProjectStatus): ProjectProposalEntity[] {
    const all = Array.from(this.proposalsById.values());
    if (!statusFilter) return all;
    return all.filter((item) => item.status === statusFilter);
  }

  updateDraftContent(
    id: string,
    dto: UpdateProjectProposalDto,
    enterpriseInfo?: { enterpriseId: string; companyName: string },
  ): ProjectProposalEntity | null {
    const existing = this.proposalsById.get(id);
    if (!existing) return null;

    const updated: ProjectProposalEntity = {
      ...existing,
      enterpriseId: enterpriseInfo?.enterpriseId ?? existing.enterpriseId,
      companyName: enterpriseInfo?.companyName ?? existing.companyName,
      title: dto.title !== undefined ? dto.title.trim() : existing.title,
      summary:
        dto.summary !== undefined ? dto.summary.trim() : existing.summary,
      description:
        dto.description !== undefined
          ? dto.description.trim()
          : existing.description,
      deliverables:
        dto.deliverables !== undefined
          ? dto.deliverables.trim()
          : existing.deliverables,
      requiredSkills:
        dto.requiredSkills !== undefined
          ? dto.requiredSkills.map((s) => s.trim()).filter(Boolean)
          : existing.requiredSkills,
      minTeamSize:
        dto.minTeamSize !== undefined ? dto.minTeamSize : existing.minTeamSize,
      maxTeamSize:
        dto.maxTeamSize !== undefined ? dto.maxTeamSize : existing.maxTeamSize,
      durationWeeks:
        dto.durationWeeks !== undefined
          ? dto.durationWeeks
          : existing.durationWeeks,
      budgetAmount:
        dto.budgetAmount !== undefined
          ? dto.budgetAmount
          : existing.budgetAmount,
      attachmentUrl:
        dto.attachmentUrl !== undefined
          ? dto.attachmentUrl?.trim() || null
          : existing.attachmentUrl,
      updatedAt: new Date().toISOString(),
    };

    this.proposalsById.set(id, updated);
    return updated;
  }

  saveEntity(entity: ProjectProposalEntity): ProjectProposalEntity {
    const updated: ProjectProposalEntity = {
      ...entity,
      updatedAt: new Date().toISOString(),
    };
    this.proposalsById.set(updated.id, updated);
    return updated;
  }

  appendAuditLog(params: {
    projectId: string;
    actorUserId: string;
    actorRole: UserRole;
    action: string;
    fromStatus: ProjectStatus | null;
    toStatus: ProjectStatus;
    reasonCode?: ProjectProposalEntity['reasonCode'];
    reasonNote?: string | null;
  }): ProjectAuditLogEntity {
    const log: ProjectAuditLogEntity = {
      id: `proj-audit-${this.auditSequence++}`,
      projectId: params.projectId,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      action: params.action,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      reasonCode: params.reasonCode ?? null,
      reasonNote: params.reasonNote ?? null,
      createdAt: new Date().toISOString(),
    };

    const list = this.auditLogsByProjectId.get(params.projectId) ?? [];
    list.push(log);
    this.auditLogsByProjectId.set(params.projectId, list);
    return log;
  }

  getAuditLogs(projectId: string): ProjectAuditLogEntity[] {
    return this.auditLogsByProjectId.get(projectId) ?? [];
  }

  clearAll(): void {
    this.proposalsById.clear();
    this.auditLogsByProjectId.clear();
    this.sequence = 1;
    this.auditSequence = 1;
  }
}