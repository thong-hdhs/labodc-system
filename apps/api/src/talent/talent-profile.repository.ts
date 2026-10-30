import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import {
  PortfolioItem,
  TalentProfile,
  UpdateTalentProfileInput,
} from './talent-profile.types';

export const TALENT_PROFILE_REPOSITORY = Symbol('TALENT_PROFILE_REPOSITORY');

export interface TalentProfileRepository {
  findByUserId(userId: string): Promise<TalentProfile | null>;
  findByStudentId(studentId: string): Promise<TalentProfile | null>;
  save(userId: string, email: string, input: UpdateTalentProfileInput): Promise<TalentProfile>;
  addPortfolioItem(userId: string, item: PortfolioItem): Promise<TalentProfile | null>;
}

interface TalentProfileRow {
  user_id: string;
  email: string;
  student_id: string;
  full_name: string;
  faculty: string | null;
  major: string | null;
  cohort: string | null;
  bio: string | null;
  skills: string[];
  certifications: string[];
  portfolio_items: PortfolioItem[];
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PostgresTalentProfileRepository
  implements TalentProfileRepository, OnModuleDestroy
{
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  async findByUserId(userId: string): Promise<TalentProfile | null> {
    const result = await this.pool.query<TalentProfileRow>(
      `SELECT tp.*, u.email
       FROM talent_profiles tp
       JOIN users u ON u.id = tp.user_id
       WHERE tp.user_id = $1`,
      [userId],
    );
    return result.rows[0] ? this.toProfile(result.rows[0]) : null;
  }

  async findByStudentId(studentId: string): Promise<TalentProfile | null> {
    const result = await this.pool.query<TalentProfileRow>(
      `SELECT tp.*, u.email
       FROM talent_profiles tp
       JOIN users u ON u.id = tp.user_id
       WHERE tp.student_id = $1`,
      [studentId],
    );
    return result.rows[0] ? this.toProfile(result.rows[0]) : null;
  }

  async save(
    userId: string,
    email: string,
    input: UpdateTalentProfileInput,
  ): Promise<TalentProfile> {
    const result = await this.pool.query<TalentProfileRow>(
      `INSERT INTO talent_profiles (
         user_id, student_id, full_name, faculty, major, cohort, bio, skills, certifications
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
       ON CONFLICT (user_id) DO UPDATE SET
         student_id = EXCLUDED.student_id,
         full_name = EXCLUDED.full_name,
         faculty = EXCLUDED.faculty,
         major = EXCLUDED.major,
         cohort = EXCLUDED.cohort,
         bio = EXCLUDED.bio,
         skills = EXCLUDED.skills,
         certifications = EXCLUDED.certifications,
         updated_at = NOW()
       RETURNING
         user_id, $10::text AS email, student_id, full_name, faculty, major, cohort, bio,
         skills, certifications, portfolio_items, created_at, updated_at`,
      [
        userId,
        input.studentId,
        input.fullName,
        input.faculty ?? null,
        input.major ?? null,
        input.cohort ?? null,
        input.bio ?? null,
        JSON.stringify(input.skills ?? []),
        JSON.stringify(input.certifications ?? []),
        email,
      ],
    );
    return this.toProfile(result.rows[0]);
  }

  async addPortfolioItem(
    userId: string,
    item: PortfolioItem,
  ): Promise<TalentProfile | null> {
    const result = await this.pool.query<TalentProfileRow>(
      `UPDATE talent_profiles AS tp
       SET portfolio_items = tp.portfolio_items || $2::jsonb, updated_at = NOW()
       WHERE tp.user_id = $1
       RETURNING
         tp.user_id,
         (SELECT u.email FROM users u WHERE u.id = tp.user_id) AS email,
         tp.student_id, tp.full_name, tp.faculty, tp.major, tp.cohort, tp.bio,
         tp.skills, tp.certifications, tp.portfolio_items, tp.created_at, tp.updated_at`,
      [userId, JSON.stringify([item])],
    );
    return result.rows[0] ? this.toProfile(result.rows[0]) : null;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  private toProfile(row: TalentProfileRow): TalentProfile {
    return {
      userId: row.user_id,
      email: row.email,
      studentId: row.student_id,
      fullName: row.full_name,
      faculty: row.faculty,
      major: row.major,
      cohort: row.cohort,
      bio: row.bio,
      skills: row.skills,
      certifications: row.certifications,
      portfolioItems: row.portfolio_items,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}

export function isProfileStudentIdConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505' &&
    'constraint' in error &&
    error.constraint === 'talent_profiles_student_id_key'
  );
}
