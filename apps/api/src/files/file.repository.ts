import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { FileAsset } from './file.types';

export const FILE_REPOSITORY = Symbol('FILE_REPOSITORY');

export interface FileRepository {
  create(asset: FileAsset): Promise<FileAsset>;
  findById(id: string): Promise<FileAsset | null>;
  findByOwner(
    ownerUserId: string,
    categories?: FileAsset['category'][],
  ): Promise<FileAsset[]>;
  findByTask(taskId: string): Promise<FileAsset[]>;
  findByReport(reportId: string): Promise<FileAsset[]>;
  markUploaded(
    id: string,
    actualBytes: number,
    format: string,
    actorUserId: string,
  ): Promise<FileAsset>;
  recordDownloadUrlIssued(id: string, actorUserId: string): Promise<void>;
}

interface FileAssetRow {
  id: string;
  owner_user_id: string;
  category: FileAsset['category'];
  file_name: string;
  mime_type: string;
  size_bytes: string | number;
  task_id: string | null;
  report_id: string | null;
  project_id: string | null;
  team_id: string | null;
  cloudinary_public_id: string;
  resource_type: FileAsset['resourceType'];
  format: string;
  status: FileAsset['status'];
  created_at: Date;
  uploaded_at: Date | null;
}

@Injectable()
export class PostgresFileRepository implements FileRepository, OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  async create(asset: FileAsset): Promise<FileAsset> {
    const result = await this.pool.query<FileAssetRow>(
      `INSERT INTO file_assets (
         id, owner_user_id, category, file_name, mime_type, size_bytes,
         task_id, report_id, project_id, team_id, cloudinary_public_id,
         resource_type, format, status, created_at, uploaded_at
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
       )
       RETURNING *`,
      [
        asset.id,
        asset.ownerUserId,
        asset.category,
        asset.fileName,
        asset.mimeType,
        asset.sizeBytes,
        asset.taskId,
        asset.reportId,
        asset.projectId,
        asset.teamId,
        asset.publicId,
        asset.resourceType,
        asset.format,
        asset.status,
        asset.createdAt,
        asset.uploadedAt,
      ],
    );
    return this.toAsset(result.rows[0]);
  }

  async findById(id: string): Promise<FileAsset | null> {
    const result = await this.pool.query<FileAssetRow>(
      'SELECT * FROM file_assets WHERE id = $1',
      [id],
    );
    return result.rows[0] ? this.toAsset(result.rows[0]) : null;
  }

  async findByOwner(
    ownerUserId: string,
    categories?: FileAsset['category'][],
  ): Promise<FileAsset[]> {
    const result = categories?.length
      ? await this.pool.query<FileAssetRow>(
          `SELECT * FROM file_assets
           WHERE owner_user_id = $1 AND category = ANY($2::varchar[])
             AND status = 'UPLOADED'
           ORDER BY created_at DESC`,
          [ownerUserId, categories],
        )
      : await this.pool.query<FileAssetRow>(
          `SELECT * FROM file_assets
           WHERE owner_user_id = $1 AND status = 'UPLOADED'
           ORDER BY created_at DESC`,
          [ownerUserId],
        );
    return result.rows.map((row) => this.toAsset(row));
  }

  async findByTask(taskId: string): Promise<FileAsset[]> {
    const result = await this.pool.query<FileAssetRow>(
      `SELECT * FROM file_assets
       WHERE task_id = $1 AND status = 'UPLOADED'
       ORDER BY created_at DESC`,
      [taskId],
    );
    return result.rows.map((row) => this.toAsset(row));
  }

  async findByReport(reportId: string): Promise<FileAsset[]> {
    const result = await this.pool.query<FileAssetRow>(
      `SELECT * FROM file_assets
       WHERE report_id = $1 AND status = 'UPLOADED'
       ORDER BY created_at DESC`,
      [reportId],
    );
    return result.rows.map((row) => this.toAsset(row));
  }

  async markUploaded(
    id: string,
    actualBytes: number,
    format: string,
    actorUserId: string,
  ): Promise<FileAsset> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<FileAssetRow>(
        `UPDATE file_assets
         SET size_bytes = $2, format = $3, status = 'UPLOADED',
             uploaded_at = NOW()
         WHERE id = $1 AND status = 'PENDING_UPLOAD'
         RETURNING *`,
        [id, actualBytes, format],
      );
      if (!result.rows[0]) {
        const existing = await client.query<FileAssetRow>(
          'SELECT * FROM file_assets WHERE id = $1 FOR UPDATE',
          [id],
        );
        if (!existing.rows[0]) throw new NotFoundException('Không tìm thấy tệp.');
        if (existing.rows[0].status !== 'UPLOADED') {
          throw new Error('Không thể hoàn tất trạng thái tệp.');
        }
        await client.query('COMMIT');
        return this.toAsset(existing.rows[0]);
      }
      await client.query(
        `INSERT INTO file_access_history (file_id, actor_user_id, action)
         VALUES ($1, $2, 'UPLOAD_COMPLETED')`,
        [id, actorUserId],
      );
      await client.query('COMMIT');
      return this.toAsset(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async recordDownloadUrlIssued(id: string, actorUserId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO file_access_history (file_id, actor_user_id, action)
       VALUES ($1, $2, 'DOWNLOAD_URL_ISSUED')`,
      [id, actorUserId],
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  private toAsset(row: FileAssetRow): FileAsset {
    return {
      id: row.id,
      ownerUserId: row.owner_user_id,
      category: row.category,
      fileName: row.file_name,
      mimeType: row.mime_type,
      sizeBytes: Number(row.size_bytes),
      taskId: row.task_id,
      reportId: row.report_id,
      projectId: row.project_id,
      teamId: row.team_id,
      publicId: row.cloudinary_public_id,
      resourceType: row.resource_type,
      format: row.format,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      uploadedAt: row.uploaded_at?.toISOString() ?? null,
    };
  }
}

@Injectable()
export class InMemoryFileRepository implements FileRepository {
  private readonly assets = new Map<string, FileAsset>();
  private readonly accessEvents = new Map<
    string,
    Array<{
      actorUserId: string;
      action: 'UPLOAD_COMPLETED' | 'DOWNLOAD_URL_ISSUED';
      createdAt: string;
    }>
  >();

  async create(asset: FileAsset): Promise<FileAsset> {
    this.assets.set(asset.id, { ...asset });
    return { ...asset };
  }

  async findById(id: string): Promise<FileAsset | null> {
    const asset = this.assets.get(id);
    return asset ? { ...asset } : null;
  }

  async findByOwner(
    ownerUserId: string,
    categories?: FileAsset['category'][],
  ): Promise<FileAsset[]> {
    return [...this.assets.values()]
      .filter(
        (asset) =>
          asset.ownerUserId === ownerUserId &&
          (!categories || categories.includes(asset.category)) &&
          asset.status === 'UPLOADED',
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((asset) => ({ ...asset }));
  }

  async findByTask(taskId: string): Promise<FileAsset[]> {
    return this.findUploaded((asset) => asset.taskId === taskId);
  }

  async findByReport(reportId: string): Promise<FileAsset[]> {
    return this.findUploaded((asset) => asset.reportId === reportId);
  }

  async markUploaded(
    id: string,
    actualBytes: number,
    format: string,
    actorUserId: string,
  ): Promise<FileAsset> {
    const asset = this.requireAsset(id);
    if (asset.status === 'UPLOADED') return { ...asset };
    const updated: FileAsset = {
      ...asset,
      sizeBytes: actualBytes,
      format,
      status: 'UPLOADED',
      uploadedAt: new Date().toISOString(),
    };
    this.assets.set(id, updated);
    this.appendAccessEvent(id, actorUserId, 'UPLOAD_COMPLETED');
    return { ...updated };
  }

  async recordDownloadUrlIssued(id: string, actorUserId: string): Promise<void> {
    this.requireAsset(id);
    this.appendAccessEvent(id, actorUserId, 'DOWNLOAD_URL_ISSUED');
  }

  clearAll(): void {
    this.assets.clear();
    this.accessEvents.clear();
  }

  private findUploaded(predicate: (asset: FileAsset) => boolean): FileAsset[] {
    return [...this.assets.values()]
      .filter((asset) => asset.status === 'UPLOADED' && predicate(asset))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((asset) => ({ ...asset }));
  }

  private requireAsset(id: string): FileAsset {
    const asset = this.assets.get(id);
    if (!asset) throw new NotFoundException('Không tìm thấy tệp.');
    return asset;
  }

  private appendAccessEvent(
    id: string,
    actorUserId: string,
    action: 'UPLOAD_COMPLETED' | 'DOWNLOAD_URL_ISSUED',
  ): void {
    const history = this.accessEvents.get(id) ?? [];
    history.push({ actorUserId, action, createdAt: new Date().toISOString() });
    this.accessEvents.set(id, history);
  }
}
