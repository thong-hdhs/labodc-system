import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../core/auth/AuthContext';

interface PublicProject {
  id: string;
  code: string;
  companyName: string;
  title: string;
  summary: string;
  description?: string;
  deliverables?: string;
  requiredSkills: string[];
  minTeamSize: number;
  maxTeamSize: number;
  durationWeeks: number;
  status: string;
  registrationOpenAt?: string | null;
  registrationCloseAt?: string | null;
}

interface RecruitmentEligibility {
  isOpenForApplications: boolean;
}

interface Application {
  id: string;
  status: string;
}

export const TalentProjectsPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [projects, setProjects] = useState<PublicProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const [keyword, setKeyword] = useState('');
  const [skill, setSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submittingProjectId, setSubmittingProjectId] = useState<string | null>(null);

  const loadProjects = useCallback(async (filters?: { keyword?: string; skill?: string }) => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const params = new URLSearchParams();
      if (filters?.keyword?.trim()) params.set('keyword', filters.keyword.trim());
      if (filters?.skill?.trim()) params.set('skill', filters.skill.trim());
      const query = params.toString();
      const response = await fetch(
        `http://localhost:3000/api/v1/projects/public${query ? `?${query}` : ''}`,
      );
      if (!response.ok) throw new Error(await readError(response));
      const published = (await response.json()) as PublicProject[];
      const eligibility = await Promise.all(
        published.map(async (project) => {
          const check = await fetch(
            `http://localhost:3000/api/v1/projects/${encodeURIComponent(project.id)}/recruitment-eligibility`,
          );
          if (!check.ok) throw new Error(await readError(check));
          return (await check.json()) as RecruitmentEligibility;
        }),
      );
      setProjects(published.filter((_, index) => eligibility[index].isOpenForApplications));
      setSelectedProject(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách dự án.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void loadProjects({ keyword, skill });
  };

  const viewDetails = async (projectId: string) => {
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/projects/public/${encodeURIComponent(projectId)}`,
      );
      if (!response.ok) throw new Error(await readError(response));
      setSelectedProject((await response.json()) as PublicProject);
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : 'Không thể tải chi tiết dự án.');
    }
  };

  const apply = async (projectId: string) => {
    if (!accessToken) {
      setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      return;
    }
    setSubmittingProjectId(projectId);
    setError('');
    setNotice('');
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/projects/${encodeURIComponent(projectId)}/applications`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!response.ok) throw new Error(await readError(response));
      const application = (await response.json()) as Application;
      setNotice(`Đã gửi đơn. Trạng thái hiện tại: ${application.status}.`);
    } catch (applyError) {
      setError(applyError instanceof Error ? applyError.message : 'Không thể gửi đơn ứng tuyển.');
    } finally {
      setSubmittingProjectId(null);
    }
  };

  return (
    <main>
      <header>
        <h1>Dự án đang tuyển Talent</h1>
        <nav>
          <Link to="/talent">Hồ sơ</Link>{' | '}
          <Link to="/talent/applications">Đơn ứng tuyển của tôi</Link>
        </nav>
      </header>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <form onSubmit={search}>
        <label>
          Từ khóa
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </label>
        <label>
          Kỹ năng
          <input value={skill} onChange={(event) => setSkill(event.target.value)} />
        </label>
        <button type="submit" disabled={loading}>Tìm dự án</button>
      </form>

      {loading ? (
        <p role="status">Đang tải dự án...</p>
      ) : projects.length === 0 ? (
        <p>Hiện chưa có dự án công khai đang nhận đơn phù hợp.</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <h2>{project.title}</h2>
              <p>{project.companyName} · {project.code}</p>
              <p>{project.summary}</p>
              <p>Kỹ năng: {project.requiredSkills.join(', ') || 'Chưa nêu'}</p>
              <button type="button" onClick={() => void viewDetails(project.id)}>
                Xem chi tiết
              </button>
              <button
                type="button"
                disabled={submittingProjectId === project.id}
                onClick={() => void apply(project.id)}
              >
                {submittingProjectId === project.id ? 'Đang gửi...' : 'Ứng tuyển'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedProject && (
        <section aria-labelledby="project-detail-title">
          <h2 id="project-detail-title">Chi tiết: {selectedProject.title}</h2>
          <p>{selectedProject.companyName} · {selectedProject.code}</p>
          <p>{selectedProject.summary}</p>
          {selectedProject.description && <p>{selectedProject.description}</p>}
          {selectedProject.deliverables && <p>Đầu ra dự kiến: {selectedProject.deliverables}</p>}
          <p>Quy mô nhóm dự kiến: {selectedProject.minTeamSize}–{selectedProject.maxTeamSize}</p>
          <p>Thời lượng: {selectedProject.durationWeeks} tuần</p>
          <button type="button" onClick={() => setSelectedProject(null)}>Đóng</button>
        </section>
      )}
    </main>
  );
};

async function readError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({} as { message?: string }));
  return body.message || `Yêu cầu thất bại (${response.status}).`;
}
