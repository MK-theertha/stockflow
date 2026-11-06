import { Suspense } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

import DashboardShell from '@/components/layout/DashboardShell';
import RequireRole from '@/features/auth/RequireRole';
import SubscriptionGate from '@/features/billing/SubscriptionGate';

import { ADMIN_ROUTES, PUBLIC_ROUTES, USER_ROUTES } from './routes';

const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
    <CircularProgress />
  </Box>
);

/** Logged in with the right role, subscribed (admins are exempt), inside the shell. */
function DashboardLayout({ role }) {
  return (
    <RequireRole role={role}>
      <SubscriptionGate>
        <DashboardShell role={role}>
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </DashboardShell>
      </SubscriptionGate>
    </RequireRole>
  );
}

function NotFound() {
  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h5">404 | This page could not be found.</Typography>
    </Box>
  );
}

const renderRoutes = (routes) =>
  routes.map(({ path, index, Component, element }) => (
    <Route key={path ?? 'index'} path={path} index={index} element={element ?? <Component />} />
  ));

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {renderRoutes(PUBLIC_ROUTES)}

        <Route path="/dashboard/user" element={<DashboardLayout role="user" />}>
          {renderRoutes(USER_ROUTES)}
        </Route>

        <Route path="/dashboard/admin" element={<DashboardLayout role="admin" />}>
          {renderRoutes(ADMIN_ROUTES)}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
