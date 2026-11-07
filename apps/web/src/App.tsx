import { SystemAdminDashboardPage } from './features/system-admin/SystemAdminDashboardPage';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthContext';
import { ProtectedRoute } from './core/auth/ProtectedRoute';
import { LoginPage } from './core/auth/LoginPage';
import { UserRole } from '@labodc/shared-types';
import { TalentProfilePage } from './features/talent/TalentProfilePage';
import { EnterpriseProfilePage } from './features/enterprise/EnterpriseProfilePage';
import { EnterpriseProposalPage } from './features/enterprise/EnterpriseProposalPage';
import { LabReviewQueuePage } from './features/project-admin/LabReviewQueuePage';
import { PayosSandboxSpikePage } from './features/finance/PayosSandboxSpikePage';
import { TalentProjectsPage } from './features/talent/TalentProjectsPage';
import { TalentApplicationsPage } from './features/talent/TalentApplicationsPage';
import { MentorApplicationsPage } from './features/mentor/MentorApplicationsPage';
import { MentorTeamsPage } from './features/mentor/MentorTeamsPage';
import { TalentTeamTasksPage } from './features/talent/TalentTeamTasksPage';
import { ProgressReportsPage } from './features/reports/ProgressReportsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute allowedRoles={[UserRole.SYSTEM_ADMIN]} />}>
            <Route path="/system-admin" element={<SystemAdminDashboardPage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.LAB_ADMIN, UserRole.SYSTEM_ADMIN]}
              />
            }
          >
            <Route path="/lab-admin" element={<LabReviewQueuePage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={[UserRole.LAB_ADMIN]} />}>
            <Route path="/lab-admin/reports" element={<ProgressReportsPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ENTERPRISE]} />}>
            <Route path="/enterprise" element={<EnterpriseProfilePage />} />
            <Route path="/enterprise/proposals" element={<EnterpriseProposalPage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  UserRole.ENTERPRISE,
                  UserRole.LAB_ADMIN,
                  UserRole.SYSTEM_ADMIN,
                ]}
              />
            }
          >
            <Route path="/finance/payos-spike" element={<PayosSandboxSpikePage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.TALENT, UserRole.TALENT_LEADER]}
              />
            }
          >
            <Route path="/talent" element={<TalentProfilePage />} />
            <Route path="/talent/projects" element={<TalentProjectsPage />} />
            <Route path="/talent/applications" element={<TalentApplicationsPage />} />
            <Route path="/talent/team" element={<TalentTeamTasksPage />} />
            <Route path="/talent/reports" element={<ProgressReportsPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={[UserRole.MENTOR]} />}>
            <Route
              path="/mentor/applications"
              element={<MentorApplicationsPage />}
            />
            <Route path="/mentor/teams" element={<MentorTeamsPage />} />
            <Route path="/mentor/reports" element={<ProgressReportsPage />} />
          </Route>
          <Route path="/403-forbidden" element={<div>403 - Bạn không có quyền truy cập trang này</div>} />
          <Route path="*" element={<Navigate replace to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;