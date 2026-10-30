export enum EnterpriseVerificationStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export interface EnterpriseProfileEntity {
  id: string;
  ownerUserId: string;
  companyName: string;
  taxCode: string;
  industry: string;
  address: string;
  website?: string;
  description?: string;
  representativeName: string;
  contactEmail: string;
  contactPhone: string;
  verificationStatus: EnterpriseVerificationStatus;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  verificationNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertEnterpriseProfileDto {
  companyName: string;
  taxCode: string;
  industry: string;
  address: string;
  website?: string;
  description?: string;
  representativeName: string;
  contactEmail: string;
  contactPhone: string;
}

export interface VerifyEnterpriseDto {
  status: EnterpriseVerificationStatus.VERIFIED | EnterpriseVerificationStatus.REJECTED;
  note?: string;
}