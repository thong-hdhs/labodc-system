export interface PortfolioItem {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'PENDING_UPLOAD';
  createdAt: string;
}

export interface TalentProfile {
  userId: string;
  email: string;
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

export interface CreatePortfolioItemInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}
