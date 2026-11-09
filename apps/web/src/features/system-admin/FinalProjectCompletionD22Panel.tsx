import React, { useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface PhaseItem {
  phaseCode: string;
  gateCode: string;
  dayRange: string;
  status: string;
}

interface CertificateItem {
  id: string;
  certificateCode: string;
  gateCode: string;
  gateStatus: string;
  releaseVersion: string;
  totalDaysCompleted: number;
  rtmCoveragePercent: number;
  slaCompliancePercent: number;
  archivalNote: string;
  issuedAt: string;
}

export const FinalProjectCompletionD22Panel: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [phases, setPhases] = useState<PhaseItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [releaseVersion, setReleaseVersion] = useState('v1.0.0-final-d22');
  const [archivalNote, setArchivalNote] = useState(
    'Nghiệm thu tổng kết 22 ngày dự án LabOdc, lưu trữ sổ cái 70/20/10 và bàn giao vận hành chính thức.',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFinalArchivalData = async () => {
    if (!accessToken) return;
    try {
      const [sumRes, certRes] = await Promise.all([
        fetch('/api/v1/system-admin/final-archival/master-summary', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('/api/v1/system-admin/final-archival/certificates', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setPhases(sumData.phases || []);
      }
      if (certRes.ok) {
        const certData = await certRes.json();
        setCertificates(Array.isArray(certData) ? certData : []);
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu Tổng kết Cuối khóa D22.');
    }
  };

  useEffect(() => {
    loadFinalArchivalData();
  }, [accessToken]);

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        '/api/v1/system-admin/final-archival/certificates',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            releaseVersion,
            archivalNote,
          }),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(
          body.message || 'Không thể cấp Chứng nhận Hoàn thành Dự án D22.',
        );
      }
      setMessage(
        `Đã cấp Chứng nhận Hoàn thành Dự án ${body.certificateCode} (${body.gateStatus})!`,
      );
      await loadFinalArchivalData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <section
      style={{
        marginTop: '1.5rem',
        padding: '1.25rem',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
      }}
    >
      <h3>
        Tổng Nghiệm thu Cuối khóa 22 Ngày & Lưu trữ Hồ sơ Bàn giao (Gate D22)
      </h3>
      {message && <p style={{ color: '#15803d', fontWeight: 600 }}>{message}</p>}
      {error && <p style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</p>}

      <h4>1. Tiến độ Hoàn thành 4 Giai đoạn Lộ trình 22 Ngày (D1 -&gt; D22)</h4>
      <ul>
        {phases.map((p, idx) => (
          <li key={idx}>
            <strong>
              [{p.gateCode} | {p.dayRange}]
            </strong>{' '}
            {p.phaseCode} — <span>{p.status}</span>
          </li>
        ))}
      </ul>

      {user?.role === 'SYSTEM_ADMIN' && (
        <form onSubmit={handleIssueCertificate} style={{ marginTop: '1rem' }}>
          <h4>2. Cấp Chứng nhận Hoàn thành Dự án & Lưu trữ Runbook (D22)</h4>
          <input
            type="text"
            value={releaseVersion}
            onChange={(e) => setReleaseVersion(e.target.value)}
            style={{ marginRight: '0.5rem', padding: '0.35rem' }}
          />
          <input
            type="text"
            value={archivalNote}
            onChange={(e) => setArchivalNote(e.target.value)}
            style={{ width: '60%', marginRight: '0.5rem', padding: '0.35rem' }}
          />
          <button type="submit">Cấp Chứng nhận Gate D22</button>
        </form>
      )}

      {certificates.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Danh sách Chứng nhận Hoàn thành Dự án Đã Cấp</h4>
          <ul>
            {certificates.map((c) => (
              <li key={c.id}>
                <strong>{c.certificateCode}</strong> ({c.releaseVersion}) —{' '}
                {c.gateStatus} | RTM: {c.rtmCoveragePercent}% | SLA:{' '}
                {c.slaCompliancePercent}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};