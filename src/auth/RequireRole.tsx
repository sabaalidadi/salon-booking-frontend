import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../api/types';
import { Spinner } from '../components/ui';
import { homeFor, useAuth } from './AuthContext';

/** Route guard: requires login, and optionally one of `roles`. */
export function RequireRole({ roles }: { roles?: UserRole[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner block />;
  if (!user) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user)} replace />;
  }
  return <Outlet />;
}
