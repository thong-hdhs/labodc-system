import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserRole } from '@labodc/shared-types';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate replace to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate replace to="/403-forbidden" />;
  }

  return <Outlet />;
};