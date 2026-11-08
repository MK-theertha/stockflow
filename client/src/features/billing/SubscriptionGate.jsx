import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import { apiFetch } from '@/lib/api-client';
import { useSession } from '@/lib/session';

// Shows children only when the user has an active subscription, otherwise
// sends them to /pricing. The API enforces the same rule server side.
export default function SubscriptionGate({ children }) {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [allowed, setAllowed] = useState(false);
  const userId = session?.user?._id;

  useEffect(() => {
    if (!userId) return;
    apiFetch(`/api/user/active/${userId}`, { method: 'POST' })
      .then(() => setAllowed(true))
      .catch(() => navigate('/pricing'));
  }, [userId, navigate]);

  if (allowed) return children;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}
