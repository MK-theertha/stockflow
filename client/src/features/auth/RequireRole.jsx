import { Navigate, useLocation } from 'react-router-dom';

import { useSession } from '@/lib/session';

// Logged-out visitors go to /login, users with the wrong role go home.
// The API enforces the same rules server side.
export default function RequireRole({ role, children }) {
  const { data, status } = useSession();
  const { pathname } = useLocation();

  if (status === 'loading') return null;
  if (!data?.user) {
    return <Navigate to={`/login?callbackUrl=${encodeURIComponent(pathname)}`} replace />;
  }
  if (data.user.role !== role) return <Navigate to="/" replace />;

  return children;
}
