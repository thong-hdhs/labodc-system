import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AssignTaskDto,
  CreateMilestoneDto,
  CreateTaskDto,
  ReviewTaskDto,
  TaskEntity,
  TaskMilestoneEntity,
  TaskStateEvent,
  TaskSubmissionEntity,
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
  private readonly stateEvents: TaskStateEvent[] = [];

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
      assignmentType: null,
      assignedUserId: null,
      templateId: input.templateId,
      templateVersion: input.templateVersion,
      createdBy,
      createdAt: now,
      updatedAt: now,
      submissions: [],
      milestones: [],
    };
    this.tasks.set(task.id, task);
    this.appendStateEvent(
      'TASK',
      task.id,
      createdBy,
      null,
      'PLANNED',
      'CREATED',
      null,
    );
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
      assignmentType: null,
      assignedUserId: null,
      templateId: input.templateId,
      templateVersion: input.templateVersion,
      createdBy,
      createdAt: new Date().toISOString(),
      submissions: [],
    };
    const updated: TaskEntity = {
      ...task,
      updatedAt: new Date().toISOString(),
      milestones: [...task.milestones, milestone],
    };
    this.tasks.set(task.id, updated);
    this.appendStateEvent(
      'MILESTONE',
      milestone.id,
      createdBy,
      null,
      'PLANNED',
      'CREATED',
      null,
    );
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

  assignTask(taskId: string, input: AssignTaskDto, actorUserId: string): TaskEntity {
    const task = this.requireTask(taskId);
    const updated: TaskEntity = {
      ...task,
      assignmentType: input.assignmentType,
      assignedUserId: input.assignmentType === 'INDIVIDUAL' ? input.userId! : null,
      status: 'ASSIGNED',
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(taskId, updated);
    this.appendStateEvent(
      'TASK',
      taskId,
      actorUserId,
      task.status,
      'ASSIGNED',
      'ASSIGNED',
      input.assignmentType,
    );
    return updated;
  }

  startTask(taskId: string, actorUserId: string): TaskEntity {
    const task = this.requireTask(taskId);
    const updated: TaskEntity = {
      ...task,
      status: 'IN_PROGRESS',
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(taskId, updated);
    this.appendStateEvent(
      'TASK',
      taskId,
      actorUserId,
      task.status,
      'IN_PROGRESS',
      'STARTED',
      null,
    );
    return updated;
  }

  submitTask(
    taskId: string,
    actorUserId: string,
    content: string,
  ): TaskEntity {
    const task = this.requireTask(taskId);
    const submission = this.createSubmission(
      task.submissions.length + 1,
      content,
      task.templateId,
      task.templateVersion,
      actorUserId,
    );
    const updated: TaskEntity = {
      ...task,
      status: 'SUBMITTED_FOR_REVIEW',
      updatedAt: new Date().toISOString(),
      submissions: [...task.submissions, submission],
    };
    this.tasks.set(taskId, updated);
    this.appendStateEvent(
      'TASK',
      taskId,
      actorUserId,
      task.status,
      'SUBMITTED_FOR_REVIEW',
      'SUBMITTED',
      null,
    );
    return updated;
  }

  reviewTask(
    taskId: string,
    actorUserId: string,
    decision: ReviewTaskDto['decision'],
    note: string | null,
  ): TaskEntity {
    const task = this.requireTask(taskId);
    const toStatus =
      decision === 'APPROVE'
        ? 'COMPLETED'
        : decision === 'REQUEST_CHANGES'
          ? 'CHANGES_REQUESTED'
          : 'CANCELLED';
    const action: TaskStateEvent['action'] =
      decision === 'APPROVE'
        ? 'COMPLETED'
        : decision === 'REQUEST_CHANGES'
          ? 'CHANGES_REQUESTED'
          : 'CANCELLED';
    const updated: TaskEntity = {
      ...task,
      status: toStatus,
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(taskId, updated);
    this.appendStateEvent(
      'TASK',
      taskId,
      actorUserId,
      task.status,
      toStatus,
      action,
      note,
    );
    return updated;
  }

  assignMilestone(
    taskId: string,
    milestoneId: string,
    input: AssignTaskDto,
    actorUserId: string,
  ): TaskEntity {
    const task = this.requireTask(taskId);
    const milestone = this.requireMilestone(task, milestoneId);
    const updatedMilestone = {
      ...milestone,
      assignmentType: input.assignmentType,
      assignedUserId:
        input.assignmentType === 'INDIVIDUAL' ? input.userId! : null,
      status: 'ASSIGNED' as const,
    };
    const updated = this.updateMilestone(task, updatedMilestone);
    this.appendStateEvent(
      'MILESTONE',
      milestoneId,
      actorUserId,
      milestone.status,
      'ASSIGNED',
      'ASSIGNED',
      input.assignmentType,
    );
    return updated;
  }

  startMilestone(
    taskId: string,
    milestoneId: string,
    actorUserId: string,
  ): TaskEntity {
    const task = this.requireTask(taskId);
    const milestone = this.requireMilestone(task, milestoneId);
    const updated = this.updateMilestone(task, {
      ...milestone,
      status: 'IN_PROGRESS',
    });
    this.appendStateEvent(
      'MILESTONE',
      milestoneId,
      actorUserId,
      milestone.status,
      'IN_PROGRESS',
      'STARTED',
      null,
    );
    return updated;
  }

  submitMilestone(
    taskId: string,
    milestoneId: string,
    actorUserId: string,
    content: string,
  ): TaskEntity {
    const task = this.requireTask(taskId);
    const milestone = this.requireMilestone(task, milestoneId);
    const submission = this.createSubmission(
      milestone.submissions.length + 1,
      content,
      milestone.templateId,
      milestone.templateVersion,
      actorUserId,
    );
    const updated = this.updateMilestone(task, {
      ...milestone,
      status: 'SUBMITTED_FOR_REVIEW',
      submissions: [...milestone.submissions, submission],
    });
    this.appendStateEvent(
      'MILESTONE',
      milestoneId,
      actorUserId,
      milestone.status,
      'SUBMITTED_FOR_REVIEW',
      'SUBMITTED',
      null,
    );
    return updated;
  }

  reviewMilestone(
    taskId: string,
    milestoneId: string,
    actorUserId: string,
    decision: ReviewTaskDto['decision'],
    note: string | null,
  ): TaskEntity {
    const task = this.requireTask(taskId);
    const milestone = this.requireMilestone(task, milestoneId);
    const toStatus =
      decision === 'APPROVE'
        ? 'COMPLETED'
        : decision === 'REQUEST_CHANGES'
          ? 'CHANGES_REQUESTED'
          : 'CANCELLED';
    const action: TaskStateEvent['action'] =
      decision === 'APPROVE'
        ? 'COMPLETED'
        : decision === 'REQUEST_CHANGES'
          ? 'CHANGES_REQUESTED'
          : 'CANCELLED';
    const updated = this.updateMilestone(task, {
      ...milestone,
      status: toStatus,
    });
    this.appendStateEvent(
      'MILESTONE',
      milestoneId,
      actorUserId,
      milestone.status,
      toStatus,
      action,
      note,
    );
    return updated;
  }

  getStateHistory(targetType: 'TASK' | 'MILESTONE', targetId: string): TaskStateEvent[] {
    return this.stateEvents
      .filter(
        (event) => event.targetType === targetType && event.targetId === targetId,
      )
      .map((event) => ({ ...event }));
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
    this.stateEvents.length = 0;
  }

  private requireTask(taskId: string): TaskEntity {
    const task = this.findById(taskId);
    if (!task) throw new NotFoundException('Không tìm thấy công việc.');
    return task;
  }

  private requireMilestone(
    task: TaskEntity,
    milestoneId: string,
  ): TaskMilestoneEntity {
    const milestone = task.milestones.find((item) => item.id === milestoneId);
    if (!milestone) throw new NotFoundException('Không tìm thấy cột mốc.');
    return milestone;
  }

  private updateMilestone(
    task: TaskEntity,
    milestone: TaskMilestoneEntity,
  ): TaskEntity {
    const updated: TaskEntity = {
      ...task,
      updatedAt: new Date().toISOString(),
      milestones: task.milestones.map((item) =>
        item.id === milestone.id ? milestone : item,
      ),
    };
    this.tasks.set(task.id, updated);
    return updated;
  }

  private createSubmission(
    version: number,
    content: string,
    templateId: string,
    templateVersion: string,
    submittedBy: string,
  ): TaskSubmissionEntity {
    return {
      id: randomUUID(),
      version,
      content,
      templateId,
      templateVersion,
      submittedBy,
      submittedAt: new Date().toISOString(),
    };
  }

  private appendStateEvent(
    targetType: TaskStateEvent['targetType'],
    targetId: string,
    actorUserId: string,
    fromStatus: TaskStateEvent['fromStatus'],
    toStatus: TaskStateEvent['toStatus'],
    action: TaskStateEvent['action'],
    note: string | null,
  ): void {
    this.stateEvents.push({
      id: randomUUID(),
      targetType,
      targetId,
      actorUserId,
      fromStatus,
      toStatus,
      action,
      note,
      createdAt: new Date().toISOString(),
    });
  }
}
