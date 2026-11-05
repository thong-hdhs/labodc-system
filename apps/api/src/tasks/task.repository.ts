import { ConflictException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateMilestoneDto,
  CreateTaskDto,
  TaskEntity,
  TaskMilestoneEntity,
  TemplateMetadata,
} from './task.types';

const DEMO_TEMPLATES: TemplateMetadata[] = [
  {
    id: 'TASK-PLAN',
    name: 'Kế hoạch công việc',
    kind: 'TASK',
    version: '1.0.0-demo',
    approvalStatus: 'DEMO/NOT_APPROVED',
    documentName: 'task-plan-demo.xlsx',
    fileReference: null,
    requiredFields: ['title', 'description', 'dueAt', 'deliverable'],
  },
  {
    id: 'MILESTONE-PLAN',
    name: 'Kế hoạch cột mốc',
    kind: 'MILESTONE',
    version: '1.0.0-demo',
    approvalStatus: 'DEMO/NOT_APPROVED',
    documentName: 'milestone-plan-demo.xlsx',
    fileReference: null,
    requiredFields: ['title', 'description', 'dueAt', 'acceptanceCriteria'],
  },
];

@Injectable()
export class TaskRepository {
  private readonly tasks = new Map<string, TaskEntity>();

  listTemplates(): TemplateMetadata[] {
    return DEMO_TEMPLATES.map((template) => ({
      ...template,
      requiredFields: [...template.requiredFields],
    }));
  }

  findTemplate(id: string): TemplateMetadata | null {
    return DEMO_TEMPLATES.find((template) => template.id === id) ?? null;
  }

  create(
    projectId: string,
    teamId: string,
    createdBy: string,
    input: CreateTaskDto,
  ): TaskEntity {
    const now = new Date().toISOString();
    const task: TaskEntity = {
      id: randomUUID(),
      projectId,
      teamId,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      dueAt: input.dueAt ?? null,
      status: 'PLANNED',
      assignedUserId: null,
      templateId: input.templateId,
      templateVersion: input.templateVersion,
      createdBy,
      createdAt: now,
      updatedAt: now,
      milestones: [],
    };
    this.tasks.set(task.id, task);
    return task;
  }

  addMilestone(
    task: TaskEntity,
    createdBy: string,
    input: CreateMilestoneDto,
  ): TaskEntity {
    const milestone: TaskMilestoneEntity = {
      id: randomUUID(),
      taskId: task.id,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      dueAt: input.dueAt ?? null,
      status: 'PLANNED',
      templateId: input.templateId,
      templateVersion: input.templateVersion,
      createdBy,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...task,
      updatedAt: new Date().toISOString(),
      milestones: [...task.milestones, milestone],
    };
    this.tasks.set(task.id, updated);
    return updated;
  }

  findById(taskId: string): TaskEntity | null {
    return this.tasks.get(taskId) ?? null;
  }

  findByTeam(teamId: string): TaskEntity[] {
    return [...this.tasks.values()]
      .filter((task) => task.teamId === teamId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  validateTemplate(id: string, version: string, kind: 'TASK' | 'MILESTONE') {
    const template = this.findTemplate(id);
    if (!template || template.kind !== kind || template.version !== version) {
      throw new ConflictException({
        code: 'TEMPLATE_VERSION_NOT_AVAILABLE',
        message: 'Template hoặc phiên bản không tồn tại/không còn hợp lệ.',
      });
    }
    return template;
  }

  clearAll(): void {
    this.tasks.clear();
  }
}
