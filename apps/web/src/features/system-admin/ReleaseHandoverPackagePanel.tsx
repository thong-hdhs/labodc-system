import React, { useEffect, useState } from 'react';
import { useAuth } from '../../core/auth/AuthContext';

interface RtmItem {
  reqCode: string;
  domain: string;
  owner: string;
  title: string;
  status: string;
}

interface GateD20Summary {
  gateCode: string;
  gateStatus: string;
  rtmCoveragePercent: number;
  adrComplianceCount: number;
  financialLedgerInvariantHold: boolean;
  slaCompliancePercent: number;
  totalHandoverPackagesIssued: number;
}

export const ReleaseHandoverPackagePanel: React.FC = () => {
  const { accessToken } = useAuth();
  const [rtmItems, setRtmItems] = useState<RtmItem[]>([]);
  const [gateSummary, setGateSummary] = useState<GateD20Summary | null>(null);
  const [releaseTag, setReleaseTag] = useState('v1.0.0-final-d20');
  const [handoverNote, setHandoverNote] = useState(
    'Đóng gói bàn giao toàn bộ mã nguồn, cơ sở dữ liệu, sổ cái 70/20/10 và tài liệu vận hành tại Cổng Gate D20.',
  );
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadHandoverData = async () => {
    if (!accessToken) return;
    const [rtmRes, gateRes] = await Promise.all([
      fetch('http://localhost:3000/api/v1/system-admin/handover/rtm-matrix', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
      fetch('http://localhost:3000/api/v1/system-admin/handover/final-gate-d20', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    ]);

    if (rtmRes.ok) {
      const rtmBody = await rtmRes.json();
      setRtmItems(rtmBody.requirements || []);
    }
    if (gateRes.ok) {
      setGateSummary(await gateRes.json());
    }
  };

  useEffect(() => {
    loadHandoverData();
  }, [accessToken]);

  const handleCreateHandoverPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const res = await fetch(
      'http://localhost:3000/api/v1/system-admin/handover/packages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          releaseTag,
          environmentTarget: 'PRODUCTION_RC',
          handoverNote,
        }),
      },
    );

    const body = await res.json();
    if (!res.ok) {
      setErrorMsg(body.message || 'Đóng gói hồ sơ bàn giao thất bại.');
      return;
    }

    setStatusMsg(
      `Đã đóng gói Hồ sơ Bàn giao Phát hành #${body.handoverCode} (${body.releaseTag})!`,
    );
    await loadHandoverData();
  };

  return (
    <section
      style={{
        marginTop: 24,
        padding: 16,
        border: '1px solid #cbd5e1',
        borderRadius: 8,
        background: '#f8fafc',
      }}
    >
      <h2>
        Ma trận Truy vết Yêu cầu (RTM) & Đóng gói Bàn giao Phát hành Cổng Cuối kỳ (Ngày D20 — Gate D20)
      </h2>

      {statusMsg && (
        <div style={{ padding: 10, background: '#dcfce7', color: '#166534', marginBottom: 12 }}>
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: 10, background: '#fee2e2', color: '#991b1b', marginBottom: 12 }}>
          {errorMsg}
        </div>
      )}

      {gateSummary && (
        <p style={{ margin: '6px 0', fontSize: 14 }}>
          Cổng Nghiệm thu: <strong>{gateSummary.gateCode}</strong> ({gateSummary.gateStatus}) | Độ
          phủ RTM: <strong>{gateSummary.rtmCoveragePercent}%</strong> | Tuân thủ ADR:{' '}
          <strong>{gateSummary.adrComplianceCount}/5</strong> | Bất biến Sổ cái 70/20/10:{' '}
          <strong>{gateSummary.financialLedgerInvariantHold ? 'PASS' : 'FAIL'}</strong> | Số gói
          bàn giao đã ký: <strong>{gateSummary.totalHandoverPackagesIssued}</strong>
        </p>
      )}

      <form
        onSubmit={handleCreateHandoverPackage}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 3fr auto',
          gap: 10,
          alignItems: 'end',
          margin: '12px 0 16px',
        }}
      >
        <label>
          Release Tag
          <input
            type="text"
            value={releaseTag}
            onChange={(e) => setReleaseTag(e.target.value)}
            style={{ width: '100%', padding: 6 }}
          />
        </label>
        <label>
          Ghi chú Bàn giao Vận hành (Tối thiểu 15 ký tự)
          <input
            type="text"
            value={handoverNote}
            onChange={(e) => setHandoverNote(e.target.value)}
            style={{ width: '100%', padding: 6 }}
          />
        </label>
        <button type="submit" style={{ padding: '8px 14px', fontWeight: 600 }}>
          Đóng gói Bàn giao Gate D20
        </button>
      </form>

      {rtmItems.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, background: '#fff' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: 6, border: '1px solid #cbd5e1' }}>Mã Yêu cầu</th>
              <th style={{ padding: 6, border: '1px solid #cbd5e1' }}>Miền</th>
              <th style={{ padding: 6, border: '1px solid #cbd5e1' }}>Owner</th>
              <th style={{ padding: 6, border: '1px solid #cbd5e1' }}>Nội dung Nghiệp vụ</th>
              <th style={{ padding: 6, border: '1px solid #cbd5e1' }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rtmItems.map((item) => (
              <tr key={item.reqCode}>
                <td style={{ padding: 6, border: '1px solid #cbd5e1', fontWeight: 600 }}>
                  {item.reqCode}
                </td>
                <td style={{ padding: 6, border: '1px solid #cbd5e1' }}>{item.domain}</td>
                <td style={{ padding: 6, border: '1px solid #cbd5e1' }}>{item.owner}</td>
                <td style={{ padding: 6, border: '1px solid #cbd5e1' }}>{item.title}</td>
                <td style={{ padding: 6, border: '1px solid #cbd5e1', color: '#166534' }}>
                  {item.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
};