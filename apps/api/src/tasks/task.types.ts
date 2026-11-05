export type TaskStatus =
  | 'PLANNED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED_FOR_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type TemplateKind = 'TASK' | 'MILESTONE';

export interface TemplateMetadata {
  id: string;
  name: string;
  kind: TemplateKind;
  version: string;
  approvalStatus: 'DEMO/NOT_APPROVED';
  documentName: string;
  fileReference: null;
  requiredFields: string[];
}

export interface TaskMilestoneEntity {
  id: string;
  taskId: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: TaskStatus;
  templateId: string;
  templateVersion: string;
  createdBy: string;
  createdAt: string;
}

export interface TaskEntity {
  id: string;
  projectId: string;
  teamId: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: TaskStatus;
  assignedUserId: null;
  templateId: string;
  templateVersion: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  milestones: TaskMilestoneEntity[];
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueAt?: string | null;
  templateId: string;
  templateVersion: string;
}

export interface CreateMilestoneDto {
  title: string;
  description?: string;
  dueAt?: string | null;
  templateId: string;
  templateVersion: string;
}
