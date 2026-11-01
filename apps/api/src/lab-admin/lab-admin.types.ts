import { ProposalRejectionReasonCode } from '@labodc/shared-types';

export interface ApproveProposalDto {
  reviewNote?: string;
}

export interface ReviewDecisionWithReasonDto {
  reasonCode: ProposalRejectionReasonCode;
  reasonNote: string;
}

export interface PublishProjectDto {
  registrationOpenAt?: string;
  registrationCloseAt: string;
  note?: string;
}

export interface LifecycleNoteDto {
  note?: string;
}