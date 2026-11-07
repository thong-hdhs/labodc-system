export type FileCategory =
  | 'AVATAR'
  | 'PORTFOLIO'
  | 'TASK_DOCUMENT'
  | 'REPORT_DOCUMENT';
export type FileResourceType = 'image' | 'raw';
export type FileAssetStatus = 'PENDING_UPLOAD' | 'UPLOADED';

export interface CreateFileUploadIntentInput {
  category: FileCategory;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  taskId?: string;
  reportId?: string;
}

export interface FileAsset {
  id: string;
  ownerUserId: string;
  category: FileCategory;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  taskId: string | null;
  reportId: string | null;
  projectId: string | null;
  teamId: string | null;
  publicId: string;
  resourceType: FileResourceType;
  format: string;
  status: FileAssetStatus;
  createdAt: string;
  uploadedAt: string | null;
}

export interface CloudinaryUploadVerification {
  publicId: string;
  resourceType: string;
  deliveryType: string;
  format: string;
  bytes: number;
}

export interface CloudinarySignedUpload {
  uploadUrl: string;
  fields: Record<string, string>;
}

export interface FileDownloadResponse {
  downloadUrl: string;
  expiresAt: string;
}
