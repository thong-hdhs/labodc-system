import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';

const API_BASE = 'http://localhost:3000/api/v1';

interface TeamView {
  id: string;
  status: string;
  project: { code: string; title: string };
  members: Array<{ userId: string; fullName: string; role: string }>;
}

interface TaskView {
  id: string;
  title: string;
  description: string;
  status: string;
  dueAt: string | null;
  templateId: string;
  templateVersion: string;
  milestones: Array<{ id: string; title: string; status: string; dueAt: string | null }>;
}

async function loadJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
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
    throw new Error(`${response.status}: ${message}`);
  }
  return body as T;
}

export const TalentTeamTasksPage: React.FC = () => {
  const { accessToken, logout } = useAuth();
  const [team, setTeam] = useState<TeamView | null>(null);
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!accessToken) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }
      try {
        const [myTeam, myTasks] = await Promise.all([
          loadJson<TeamView>('/talent/me/team', accessToken),
          loadJson<TaskView[]>('/talent/me/tasks', accessToken),
        ]);
        setTeam(myTeam);
        setTasks(myTasks);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Không thể tải Team và công việc.',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [accessToken]);

  return (
    <main className="talent-workspace">
      <header>
        <h1>Team và công việc của tôi</h1>
        <nav>
          <Link to="/talent">Hồ sơ</Link>{' '}
          <Link to="/talent/projects">Dự án</Link>{' '}
          <Link to="/talent/applications">Đơn ứng tuyển</Link>{' '}
          <button onClick={logout}>Đăng xuất</button>
        </nav>
      </header>
      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p role="alert">{error}</p>}
      {team && (
        <section>
          <h2>{team.project.code} — {team.project.title}</h2>
          <p>Trạng thái Team: {team.status}</p>
          <ul>
            {team.members.map((member) => (
              <li key={member.userId}>
                {member.fullName} {member.role === 'LEADER' ? '(Leader)' : '(Thành viên)'}
              </li>
            ))}
          </ul>
        </section>
      )}
      {team && (
        <section>
          <h2>Công việc và cột mốc</h2>
          {tasks.length === 0 && <p>Mentor chưa tạo kế hoạch công việc.</p>}
          {tasks.map((task) => (
            <article key={task.id}>
              <h3>{task.title} · {task.status}</h3>
              <p>{task.description}</p>
              <small>Template {task.templateId} v{task.templateVersion} · Chưa được giao</small>
              <ul>
                {task.milestones.map((milestone) => (
                  <li key={milestone.id}>{milestone.title} · {milestone.status}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
      <style>{`
        .talent-workspace{max-width:900px;margin:32px auto;padding:0 20px;font-family:Arial,sans-serif}
        .talent-workspace header{display:flex;align-items:center;justify-content:space-between}
        .talent-workspace section,.talent-workspace article{border:1px solid #d1d5db;border-radius:8px;padding:16px;margin:16px 0}
      `}</style>
    </main>
  );
};
