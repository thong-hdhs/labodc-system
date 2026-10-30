import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './core/auth/AuthContext';
import { ProtectedRoute } from './core/auth/ProtectedRoute';
import { LoginPage } from './core/auth/LoginPage';
import { UserRole } from '@labodc/shared-types';
import { TalentProfilePage } from './features/talent/TalentProfilePage';
import { EnterpriseProfilePage } from './features/enterprise/EnterpriseProfilePage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute allowedRoles={[UserRole.SYSTEM_ADMIN]} />}>
            <Route path="/system-admin" element={<div>System Admin Dashboard (Owner: A)</div>} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={[UserRole.LAB_ADMIN]} />}>
            <Route path="/lab-admin" element={<div>Lab Admin Dashboard (Owner: A)</div>} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={[UserRole.ENTERPRISE]} />}>
            <Route path="/enterprise" element={<EnterpriseProfilePage />} />
          </Route>
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[UserRole.TALENT, UserRole.TALENT_LEADER, UserRole.MENTOR]}
              />
            }
          >
            <Route path="/talent" element={<TalentProfilePage />} />
          </Route>
          <Route path="/403-forbidden" element={<div>403 - Bạn không có quyền truy cập trang này</div>} />
          <Route path="*" element={<Navigate replace to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;