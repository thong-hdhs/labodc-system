import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  Inject,
} from '@nestjs/common';
import { JwtPayload, UserRole } from '@labodc/shared-types';
import { randomUUID } from 'crypto';
import { TalentService } from '../talent/talent.service';
import { TeamsService } from '../teams/teams.service';
import { TasksService } from '../tasks/tasks.service';
import { ReportsService } from '../reports/reports.service';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { FILE_REPOSITORY, FileRepository } from './file.repository';
import {
  CreateFileUploadIntentInput,
  FileAsset,
  FileCategory,
  FileDownloadResponse,
  FileResourceType,
} from './file.types';

const MEBIBYTE = 1024 * 1024;
const MAX_UPLOAD_AGE_MS = 15 * 60 * 1000;
const DOWNLOAD_URL_TTL_SECONDS = 60;

const FILE_POLICIES: Record<
  FileCategory,
  { maxBytes: number; mimeTypes: Record<string, string> }
> = {
  AVATAR: {
    maxBytes: 5 * MEBIBYTE,
    mimeTypes: {
      'image/jpeg': 'jpg',
      'image/png': 'png',
    },
  },
  PORTFOLIO: {
    maxBytes: 10 * MEBIBYTE,
    mimeTypes: {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png',
    },
  },
  TASK_DOCUMENT: {
    maxBytes: 20 * MEBIBYTE,
    mimeTypes: {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'xlsx',
      'text/csv': 'csv',
    },
  },
  REPORT_DOCUMENT: {
    maxBytes: 20 * MEBIBYTE,
    mimeTypes: {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        'docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        'xlsx',
      'text/csv': 'csv',
    },
  },
};

const ALLOWED_FORMATS = Object.fromEntries(
  Object.entries(FILE_POLICIES).map(([category, policy]) => [
    category,
    [...new Set(Object.values(policy.mimeTypes))],
  ]),
) as Record<FileCategory, string[]>;

@Injectable()
export class FilesService {
  constructor(
    @Inject(FILE_REPOSITORY) private readonly files: FileRepository,
    private readonly storage: CloudinaryStorageService,
    private readonly talent: TalentService,
    private readonly teams: TeamsService,
    private readonly tasks: TasksService,
    private readonly reports: ReportsService,
  ) {}

  async createUploadIntent(
    user: JwtPayload,
    input: CreateFileUploadIntentInput,
  ) {
    const metadata = this.validateUploadInput(input);
    const fileName = this.normalizeFileName(input.fileName);
    let taskId: string | null = null;
    let reportId: string | null = null;
    let projectId: string | null = null;
    let teamId: string | null = null;

    switch (input.category) {
      case 'AVATAR':
      case 'PORTFOLIO':
        this.assertTalentOwner(user);
        if (!(await this.talent.getMyProfile(user.sub))) {
          throw new NotFoundException('Hãy lưu hồ sơ Talent trước khi tải tệp lên.');
        }
        break;
      case 'TASK_DOCUMENT': {
        if (!input.taskId || input.reportId) {
          throw new BadRequestException('Tệp Task cần taskId và không nhận reportId.');
        }
        const task = this.tasks.assertCanAccessTaskFiles(
          user,
          input.taskId,
          'UPLOAD',
        );
        taskId = task.id;
        projectId = task.projectId;
        teamId = task.teamId;
        break;
      }
      case 'REPORT_DOCUMENT': {
        if (!input.reportId || input.taskId) {
          throw new BadRequestException('Tệp báo cáo cần reportId và không nhận taskId.');
        }
        const report = this.reports.assertCanAccessReportFiles(
          user,
          input.reportId,
          'UPLOAD',
        );
        reportId = report.id;
        projectId = report.projectId;
        teamId = report.teamId;
        break;
      }
      default:
        throw new BadRequestException('Loại tệp không được hỗ trợ.');
    }

    const id = randomUUID();
    const resourceType: FileResourceType =
      metadata.format === 'jpg' || metadata.format === 'png' ? 'image' : 'raw';
    const asset: FileAsset = {
      id,
      ownerUserId: user.sub,
      category: input.category,
      fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      taskId,
      reportId,
      projectId,
      teamId,
      publicId: `labodc/${input.category.toLowerCase()}/${id}`,
      resourceType,
      format: metadata.format,
      status: 'PENDING_UPLOAD',
      createdAt: new Date().toISOString(),
      uploadedAt: null,
    };

    const signedUpload = this.storage.createSignedUpload(
      asset,
      ALLOWED_FORMATS[input.category],
    );
    await this.files.create(asset);
    return {
      file: this.presentFile(asset),
      uploadUrl: signedUpload.uploadUrl,
      uploadFields: signedUpload.fields,
      expiresInSeconds: MAX_UPLOAD_AGE_MS / 1000,
    };
  }

  async completeUpload(user: JwtPayload, fileId: string) {
    const asset = await this.getFile(fileId);
    if (asset.ownerUserId !== user.sub) {
      throw new ForbiddenException('Chỉ người tạo upload mới được hoàn tất.');
    }
    if (asset.status === 'UPLOADED') return this.presentFile(asset);
    if (Date.now() - new Date(asset.createdAt).getTime() > MAX_UPLOAD_AGE_MS) {
      throw new ConflictException('Phiên upload đã hết hạn; hãy tạo yêu cầu upload mới.');
    }

    const uploaded = await this.storage.verifyUploadedAsset(asset);
    if (
      uploaded.publicId !== asset.publicId ||
      uploaded.resourceType !== asset.resourceType ||
      uploaded.deliveryType !== 'authenticated' ||
      uploaded.bytes !== asset.sizeBytes ||
      uploaded.bytes <= 0 ||
      uploaded.bytes > FILE_POLICIES[asset.category].maxBytes ||
      this.normalizeFormat(uploaded.format) !== asset.format
    ) {
      throw new BadRequestException(
        'Tệp Cloudinary không khớp loại, kích thước hoặc định dạng đã khai báo.',
      );
    }

    if (asset.category === 'PORTFOLIO') {
      await this.talent.addUploadedPortfolioItem(user.sub, {
        id: asset.id,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        sizeBytes: uploaded.bytes,
      });
    } else if (asset.category === 'AVATAR') {
      await this.talent.setAvatarFileId(user.sub, asset.id);
    }

    return this.presentFile(
      await this.files.markUploaded(
        fileId,
        uploaded.bytes,
        this.normalizeFormat(uploaded.format),
        user.sub,
      ),
    );
  }

  async listMyProfileFiles(user: JwtPayload) {
    this.assertTalentOwner(user);
    return (await this.files.findByOwner(user.sub, ['AVATAR', 'PORTFOLIO'])).map(
      (asset) => this.presentFile(asset),
    );
  }

  async listTaskFiles(user: JwtPayload, taskId: string) {
    this.tasks.assertCanAccessTaskFiles(user, taskId, 'READ');
    return (await this.files.findByTask(taskId)).map((asset) =>
      this.presentFile(asset),
    );
  }

  async listReportFiles(user: JwtPayload, reportId: string) {
    this.reports.assertCanAccessReportFiles(user, reportId, 'READ');
    return (await this.files.findByReport(reportId)).map((asset) =>
      this.presentFile(asset),
    );
  }

  async getDownloadUrl(
    user: JwtPayload,
    fileId: string,
  ): Promise<FileDownloadResponse> {
    const asset = await this.getFile(fileId);
    if (asset.status !== 'UPLOADED') {
      throw new NotFoundException('Tệp chưa được tải lên hoàn chỉnh.');
    }
    await this.assertCanAccessFile(user, asset, 'READ');

    const expiresAt = Math.floor(Date.now() / 1000) + DOWNLOAD_URL_TTL_SECONDS;
    const downloadUrl = this.storage.createPrivateDownloadUrl(asset, expiresAt);
    await this.files.recordDownloadUrlIssued(asset.id, user.sub);
    return {
      downloadUrl,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    };
  }

  private async assertCanAccessFile(
    user: JwtPayload,
    asset: FileAsset,
    action: 'READ' | 'UPLOAD',
  ): Promise<void> {
    if (asset.category === 'AVATAR' || asset.category === 'PORTFOLIO') {
      if (user.sub === asset.ownerUserId) return;
      if (user.role === UserRole.LAB_ADMIN) return;
      if (asset.category === 'PORTFOLIO' && user.role === UserRole.MENTOR) {
        const ownerTeam = this.teams.findTeamForMember(asset.ownerUserId);
        if (!ownerTeam) {
          throw new ForbiddenException('Tệp portfolio không thuộc phạm vi Team của bạn.');
        }
        this.teams.assertMentorProject(user, ownerTeam.projectId);
        return;
      }
      throw new ForbiddenException('Bạn không có quyền truy cập tệp hồ sơ này.');
    }
    if (asset.taskId) {
      this.tasks.assertCanAccessTaskFiles(user, asset.taskId, action);
      return;
    }
    if (asset.reportId) {
      this.reports.assertCanAccessReportFiles(user, asset.reportId, action);
      return;
    }
    throw new ForbiddenException('Tệp không có resource scope hợp lệ.');
  }

  private validateUploadInput(input: CreateFileUploadIntentInput): {
    format: string;
  } {
    if (
      !input ||
      !Object.prototype.hasOwnProperty.call(FILE_POLICIES, input.category)
    ) {
      throw new BadRequestException('Loại tệp không hợp lệ.');
    }
    const policy = FILE_POLICIES[input.category];
    const format = policy.mimeTypes[input.mimeType];
    if (
      !format ||
      typeof input.fileName !== 'string' ||
      input.fileName.trim().length === 0 ||
      input.fileName.length > 255 ||
      !Number.isSafeInteger(input.sizeBytes) ||
      input.sizeBytes <= 0 ||
      input.sizeBytes > policy.maxBytes
    ) {
      throw new BadRequestException(
        `Tệp ${input.category} phải đúng MIME đã cho phép và có kích thước từ 1 byte đến ${policy.maxBytes / MEBIBYTE} MiB.`,
      );
    }
    const extension = this.getExtension(input.fileName);
    const validExtensions =
      format === 'jpg' ? ['jpg', 'jpeg'] : [format];
    if (!validExtensions.includes(extension)) {
      throw new BadRequestException('Phần mở rộng tệp không khớp MIME type.');
    }
    return { format };
  }

  private normalizeFormat(format: string): string {
    const normalized = format.toLowerCase();
    return normalized === 'jpeg' ? 'jpg' : normalized;
  }

  private getExtension(fileName: string): string {
    const normalized = fileName.replace(/\\/g, '/').split('/').pop() ?? '';
    const separator = normalized.lastIndexOf('.');
    return separator > 0 ? normalized.slice(separator + 1).toLowerCase() : '';
  }

  private normalizeFileName(fileName: string): string {
    return (fileName.replace(/\\/g, '/').split('/').pop() ?? '')
      .replace(/[\u0000-\u001f\u007f]/g, '')
      .trim();
  }

  private assertTalentOwner(user: JwtPayload): void {
    if (
      user.role !== UserRole.TALENT &&
      user.role !== UserRole.TALENT_LEADER
    ) {
      throw new ForbiddenException('Chỉ Talent mới được quản lý tệp hồ sơ của mình.');
    }
  }

  private async getFile(fileId: string): Promise<FileAsset> {
    const asset = await this.files.findById(fileId);
    if (!asset) throw new NotFoundException('Không tìm thấy tệp.');
    return asset;
  }

  private presentFile(asset: FileAsset) {
    return {
      id: asset.id,
      category: asset.category,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      taskId: asset.taskId,
      reportId: asset.reportId,
      projectId: asset.projectId,
      teamId: asset.teamId,
      status: asset.status,
      createdAt: asset.createdAt,
      uploadedAt: asset.uploadedAt,
    };
  }
}
