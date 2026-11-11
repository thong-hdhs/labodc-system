import { useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface CodeFreezeInventoryDto {
  inventoryCode: string;
  totalCodingDaysCompleted: number;
  studentAMigrationsCount: number;
  studentBMigrationsCount: number;
  totalDatabaseMigrations: number;
  rtmCoveragePercent: number;
  slaCompliancePercent: number;
  ledgerInvariantHold: boolean;
  codeFreezeLocked: boolean;
}

export function FinalCodeFreezeD27Panel() {
  const { accessToken, user } = useAuth();
  const [inventory, setInventory] = useState<CodeFreezeInventoryDto | null>(
    null,
  );
  const [releaseCandidateTag, setReleaseCandidateTag] = useState(
    'v3.0.0-rc-freeze-d27',
  );
  const [nextPhasePlan, setNextPhasePlan] = useState(
    'Hoàn tất 27 ngày code Full-Stack (Web + API + Mobile). Chuyển toàn bộ sang giai đoạn Kiểm thử التích hợp (System Test) và Triển khai Production (Deploy).',
  );
  const [error, setError] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const loadInventory = async () => {
    try {
      setError(null);
      const res = await fetch('/api/v1/system-admin/code-freeze-d27/inventory', {
        headers,
      });
      if (res.ok) {
        setInventory(await res.json());
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Lỗi tải thông tin Code Freeze D27',
      );
    }
  };

  useEffect(() => {
    if (accessToken) {
      void loadInventory();
    }
  }, [accessToken]);

  const handleLockFreeze = async () => {
    try {
      setError(null);
      const res = await fetch(
        '/api/v1/system-admin/code-freeze-d27/lock-manifest',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ releaseCandidateTag, nextPhasePlan }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }
      await loadInventory();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể khóa Code Freeze D27',
      );
    }
  };

  return (
    <section className="sys-panel">
      <h3>
        Cổng D27 — Đóng băng Mã nguồn Toàn Hệ thống (Code Freeze) & Bàn giao
        Sang Giai đoạn Test / Deploy
      </h3>
      {error && <p className="error-banner">{error}</p>}

      {inventory && (
        <div className="metrics-grid">
          <div className="metric-card">
            <strong>Tổng Ngày Code Hoàn tất:</strong>{' '}
            {inventory.totalCodingDaysCompleted} Ngày (D1 &rarr; D27)
          </div>
          <div className="metric-card">
            <strong>Tổng Migrations (A + B):</strong>{' '}
            {inventory.totalDatabaseMigrations} ({inventory.studentAMigrationsCount}{' '}
            A + {inventory.studentBMigrationsCount} B)
          </div>
          <div className="metric-card">
            <strong>Trạng thái Code Freeze:</strong>{' '}
            {inventory.codeFreezeLocked
              ? 'CODE_FROZEN_READY_FOR_TEST_AND_DEPLOY'
              : 'OPEN'}
          </div>
        </div>
      )}

      {user?.role === 'SYSTEM_ADMIN' && (
        <div style={{ marginTop: '1rem' }}>
          <input
            type="text"
            value={releaseCandidateTag}
            onChange={(e) => setReleaseCandidateTag(e.target.value)}
            placeholder="Release Candidate Tag"
          />
          <input
            type="text"
            value={nextPhasePlan}
            onChange={(e) => setNextPhasePlan(e.target.value)}
            placeholder="Kế hoạch giai đoạn Test & Deploy"
          />
          <button type="button" onClick={handleLockFreeze}>
            Khóa Đóng băng Mã nguồn Gate D27 (Code Freeze)
          </button>
        </div>
      )}
    </section>
  );
}