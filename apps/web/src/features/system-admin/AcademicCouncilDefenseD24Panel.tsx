import React, { useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface LedgerSealItem {
  id: string;
  sealCode: string;
  releaseTag: string;
  totalEscrowDepositedVnd: number;
  totalDisbursed702010Vnd: number;
  escrowHeldBalanceVnd: number;
  invariantVerified: boolean;
}

export const AcademicCouncilDefenseD24Panel: React.FC = () => {
  const { accessToken, user } = useAuth();
  const [latestSeal, setLatestSeal] = useState<LedgerSealItem | null>(null);
  const [gateD24SignedOff, setGateD24SignedOff] = useState(false);
  const [releaseTag, setReleaseTag] = useState('v1.0.0-final-defense-d24');
  const [sealNote, setSealNote] = useState(
    'Niêm phong vĩnh viễn sổ cái bất biến 70/20/10 phục vụ Hội đồng Nghiệm thu D24.',
  );
  const [studentAScore, setStudentAScore] = useState(98);
  const [studentBScore, setStudentBScore] = useState(98);
  const [councilEvaluationNote, setCouncilEvaluationNote] = useState(
    'Hội đồng nghiệm thu đánh giá xuất sắc: Kiến trúc Modular Monolith, Sổ cái 70/20/10 và Mobile Companion đồng bộ 100%.',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDossierData = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('/api/v1/system-admin/academic-defense/dossier', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLatestSeal(data.latestSeal || null);
        setGateD24SignedOff(Boolean(data.gateD24SignedOff));
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi tải Hồ sơ Bảo vệ Đồ án Gate D24.');
    }
  };

  useEffect(() => {
    loadDossierData();
  }, [accessToken]);

  const handleSealLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        '/api/v1/system-admin/academic-defense/ledger-seals',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ releaseTag, sealNote }),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.message || 'Không thể niêm phong sổ cái D24.');
      }
      setMessage(`Đã niêm phong sổ cái thành công: ${body.sealCode}!`);
      await loadDossierData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRecordVerdict = async () => {
    if (!accessToken || !latestSeal) return;
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        '/api/v1/system-admin/academic-defense/gate-d24-verdict',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            ledgerSealId: latestSeal.id,
            studentAScore: Number(studentAScore),
            studentBScore: Number(studentBScore),
            councilEvaluationNote,
          }),
        },
      );
      const body = await res.json();
      if (!res.ok) {
        throw new Error(
          body.message || 'Không thể ghi nhận kết quả Hội đồng Gate D24.',
        );
      }
      setMessage(
        `Đã ký Quyết định Nghiệm thu Hội đồng ${body.verdictCode} (${body.verdictStatus} - Điểm TB: ${body.averageScore}/100)!`,
      );
      await loadDossierData();
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
        Niêm phong Vĩnh viễn Sổ cái 70/20/10 & Nghiệm thu Hội đồng Bảo vệ Đồ án (Gate D24)
      </h3>
      {message && <p style={{ color: '#15803d', fontWeight: 600 }}>{message}</p>}
      {error && <p style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <strong>
          Trạng thái Cổng Gate D24:{' '}
          {gateD24SignedOff ? 'APPROVED_WITH_DISTINCTION' : 'PENDING'}
        </strong>
      </div>

      <form onSubmit={handleSealLedger} style={{ marginTop: '1rem' }}>
        <h4>1. Niêm phong Vĩnh viễn Sổ cái Bất biến 70/20/10</h4>
        <input
          type="text"
          value={releaseTag}
          onChange={(e) => setReleaseTag(e.target.value)}
          style={{ marginRight: '0.5rem', padding: '0.35rem' }}
        />
        <input
          type="text"
          value={sealNote}
          onChange={(e) => setSealNote(e.target.value)}
          style={{ width: '55%', marginRight: '0.5rem', padding: '0.35rem' }}
        />
        <button type="submit">Niêm phong Sổ cái</button>
      </form>

      {latestSeal && (
        <div style={{ marginTop: '1rem' }}>
          <p>
            Mã niêm phong: <strong>{latestSeal.sealCode}</strong> | Số dư treo:{' '}
            {latestSeal.escrowHeldBalanceVnd} VND | Invariant:{' '}
            {latestSeal.invariantVerified ? 'TRUE' : 'FALSE'}
          </p>
          {user?.role === 'SYSTEM_ADMIN' && !gateD24SignedOff && (
            <div style={{ marginTop: '0.75rem' }}>
              <h4>2. Ghi nhận Điểm & Quyết định Nghiệm thu của Hội đồng (D24)</h4>
              <input
                type="number"
                value={studentAScore}
                onChange={(e) => setStudentAScore(Number(e.target.value))}
                style={{ width: '80px', marginRight: '0.5rem' }}
              />
              <input
                type="number"
                value={studentBScore}
                onChange={(e) => setStudentBScore(Number(e.target.value))}
                style={{ width: '80px', marginRight: '0.5rem' }}
              />
              <input
                type="text"
                value={councilEvaluationNote}
                onChange={(e) => setCouncilEvaluationNote(e.target.value)}
                style={{ width: '60%', marginRight: '0.5rem' }}
              />
              <button type="button" onClick={handleRecordVerdict}>
                Ký Quyết định Hội đồng Gate D24
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};