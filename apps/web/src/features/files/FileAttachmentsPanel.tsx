import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

const API_BASE = 'http://localhost:3000/api/v1';

export type FileCategory =
  | 'AVATAR'
  | 'PORTFOLIO'
  | 'TASK_DOCUMENT'
  | 'REPORT_DOCUMENT';

interface FileView {
  id: string;
  category: FileCategory;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'PENDING_UPLOAD' | 'UPLOADED';
  createdAt: string;
}

interface UploadIntent {
  file: FileView;
  uploadUrl: string;
  uploadFields: Record<string, string>;
  expiresInSeconds: number;
}

interface FileAttachmentsPanelProps {
  category: FileCategory;
  taskId?: string;
  reportId?: string;
  canUpload?: boolean;
  onUploaded?: () => void;
}

async function apiRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const body: unknown = await response.json();
  if (!response.ok) {
    const message =
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
        ? body.message
        : `Yêu cầu thất bại (${response.status}).`;
    throw new Error(message);
  }
  return body as T;
}

const acceptedFiles: Record<FileCategory, string> = {
  AVATAR: '.jpg,.jpeg,.png,image/jpeg,image/png',
  PORTFOLIO: '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png',
  TASK_DOCUMENT:
    '.pdf,.docx,.xlsx,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv',
  REPORT_DOCUMENT:
    '.pdf,.docx,.xlsx,.csv,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv',
};

const limitsInBytes: Record<FileCategory, number> = {
  AVATAR: 5 * 1024 * 1024,
  PORTFOLIO: 10 * 1024 * 1024,
  TASK_DOCUMENT: 20 * 1024 * 1024,
  REPORT_DOCUMENT: 20 * 1024 * 1024,
};

function listPath(category: FileCategory, taskId?: string, reportId?: string) {
  if (category === 'AVATAR' || category === 'PORTFOLIO') {
    return '/talent/me/files';
  }
  if (category === 'TASK_DOCUMENT' && taskId) {
    return `/tasks/${taskId}/files`;
  }
  if (category === 'REPORT_DOCUMENT' && reportId) {
    return `/reports/${reportId}/files`;
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export const FileAttachmentsPanel: React.FC<FileAttachmentsPanelProps> = ({
  category,
  taskId,
  reportId,
  canUpload = true,
  onUploaded,
}) => {
  const { accessToken } = useAuth();
  const [files, setFiles] = useState<FileView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const path = listPath(category, taskId, reportId);
  const load = useCallback(async () => {
    if (!accessToken || !path) {
      setLoading(false);
      setFiles([]);
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest<FileView[]>(path, accessToken);
      setFiles(result.filter((file) => file.category === category));
      setError('');
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Không thể tải danh sách tệp.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, category, path]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !accessToken) return;
    if (file.size <= 0 || file.size > limitsInBytes[category]) {
      setError(`Kích thước tệp vượt giới hạn ${formatBytes(limitsInBytes[category])}.`);
      return;
    }
    if (
      (category === 'TASK_DOCUMENT' && !taskId) ||
      (category === 'REPORT_DOCUMENT' && !reportId)
    ) {
      setError('Thiếu resource ID để gắn tệp.');
      return;
    }
    setBusy('upload');
    setError('');
    setNotice('');
    try {
      const intent = await apiRequest<UploadIntent>(
        '/files/upload-intents',
        accessToken,
        {
          method: 'POST',
          body: JSON.stringify({
            category,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            ...(taskId ? { taskId } : {}),
            ...(reportId ? { reportId } : {}),
          }),
        },
      );
      const formData = new FormData();
      Object.entries(intent.uploadFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', file);
      const cloudinaryResponse = await fetch(intent.uploadUrl, {
        method: 'POST',
        body: formData,
      });
      if (!cloudinaryResponse.ok) {
        throw new Error(
          `Cloudinary từ chối upload (${cloudinaryResponse.status}); chưa ghi nhận tệp.`,
        );
      }
      await apiRequest(`/files/${intent.file.id}/complete`, accessToken, {
        method: 'POST',
      });
      await load();
      onUploaded?.();
      setNotice('Tệp đã tải lên private và được gắn vào hồ sơ/công việc.');
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Không thể tải tệp lên.',
      );
    } finally {
      setBusy('');
    }
  };

  const download = async (file: FileView) => {
    if (!accessToken) return;
    setBusy(`download-${file.id}`);
    setError('');
    setNotice('');
    try {
      const response = await apiRequest<{ downloadUrl: string }>(
        `/files/${file.id}/download`,
        accessToken,
      );
      const anchor = document.createElement('a');
      anchor.href = response.downloadUrl;
      anchor.download = file.fileName;
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'Không thể tải tệp xuống.',
      );
    } finally {
      setBusy('');
    }
  };

  return (
    <section aria-label={`Tệp đính kèm ${category}`} style={{ margin: '12px 0' }}>
      {canUpload && (
        <label>
          {category === 'AVATAR'
            ? 'Tải ảnh đại diện'
            : category === 'PORTFOLIO'
              ? 'Thêm tệp portfolio'
              : 'Đính kèm tài liệu'}
          <input
            type="file"
            accept={acceptedFiles[category]}
            onChange={upload}
            disabled={Boolean(busy)}
          />
        </label>
      )}
      {category !== 'AVATAR' && (
        <small>Private; giới hạn {formatBytes(limitsInBytes[category])}.</small>
      )}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p>Đang tải danh sách tệp...</p>
      ) : files.length === 0 ? (
        <p>Chưa có tệp.</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file.id}>
              {file.fileName} — {formatBytes(file.sizeBytes)}{' '}
              <button
                type="button"
                onClick={() => void download(file)}
                disabled={Boolean(busy)}
              >
                {busy === `download-${file.id}` ? 'Đang tải...' : 'Tải xuống'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
