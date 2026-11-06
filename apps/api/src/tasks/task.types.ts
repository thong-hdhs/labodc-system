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
  assignmentType: 'INDIVIDUAL' | 'TEAM' | null;
  assignedUserId: string | null;
  templateId: string;
  templateVersion: string;
  createdBy: string;
  createdAt: string;
  submissions: TaskSubmissionEntity[];
}

export interface TaskEntity {
  id: string;
  projectId: string;
  teamId: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: TaskStatus;
  assignmentType: 'INDIVIDUAL' | 'TEAM' | null;
  assignedUserId: string | null;
  templateId: string;
  templateVersion: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  submissions: TaskSubmissionEntity[];
  milestones: TaskMilestoneEntity[];
}

export interface TaskSubmissionEntity {
  id: string;
  version: number;
  content: string;
  templateId: string;
  templateVersion: string;
  submittedBy: string;
  submittedAt: string;
}

export interface TaskStateEvent {
  id: string;
  targetType: 'TASK' | 'MILESTONE';
  targetId: string;
  actorUserId: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  action:
    | 'ASSIGNED'
    | 'CREATED'
    | 'STARTED'
    | 'SUBMITTED'
    | 'CHANGES_REQUESTED'
    | 'COMPLETED'
    | 'CANCELLED';
  note: string | null;
  createdAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  dueAt?: string | null;
  templateId: string;
  templateVersion: string;
}

export interface AssignTaskDto {
  assignmentType: 'INDIVIDUAL' | 'TEAM';
  userId?: string;
}

export interface SubmitTaskDto {
  content: string;
  templateVersion: string;
}

export interface SubmitMilestoneDto extends SubmitTaskDto {}

export interface ReviewTaskDto {
  decision: 'APPROVE' | 'REQUEST_CHANGES' | 'CANCEL';
  note?: string;
}

export interface CreateMilestoneDto {
  title: string;
  description?: string;
  dueAt?: string | null;
  templateId: string;
  templateVersion: string;
}
