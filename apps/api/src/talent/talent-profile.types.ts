export interface PortfolioItem {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'UPLOADED';
  createdAt: string;
}

export interface TalentProfile {
  userId: string;
  email: string;
  avatarFileId?: string | null;
  studentId: string;
  fullName: string;
  faculty: string | null;
  major: string | null;
  cohort: string | null;
  bio: string | null;
  skills: string[];
  certifications: string[];
  portfolioItems: PortfolioItem[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTalentProfileInput {
  studentId: string;
  fullName: string;
  faculty?: string;
  major?: string;
  cohort?: string;
  bio?: string;
  skills?: string[];
  certifications?: string[];
}
