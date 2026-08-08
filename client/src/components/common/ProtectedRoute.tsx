import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import Loader from './Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return <Loader label="AUTHENTICATING SESSION..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
        <div className="bg-brand-dark border-2 border-brand-red p-8 max-w-md w-full">
          <div className="text-brand-red font-mono text-sm font-bold uppercase mb-2">403_ACCESS_DENIED</div>
          <p className="text-xs font-mono text-zinc-400 mb-4">
            Your current role ({user.role}) is not authorized to access this section.
          </p>
          <a
            href="/"
            className="inline-block bg-brand-black border border-brand-border hover:border-brand-red text-white px-4 py-2 font-mono text-xs uppercase"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
