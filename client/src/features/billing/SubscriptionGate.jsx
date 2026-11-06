import { useEffect, useState } from 'react';
import { useSession } from '@/lib/session';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { CloudDownload } from '@mui/icons-material';
import { motion } from 'framer-motion';

import { apiFetch } from '@/lib/api-client';

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
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <Box
        sx={{
          backgroundImage: 'url("/images/pos1.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          borderRadius: '16px',
          padding: 4,
        }}
      >
        <CloudDownload sx={{ color: 'blue', fontSize: 60, mb: 2 }} />
        <Typography variant="h4" sx={{ color: '#fff', fontWeight: 'bold', mb: 3 }}>
          Loading...
        </Typography>
        <CircularProgress size={60} color="primary" sx={{ mt: 2 }} />
      </Box>
    </motion.div>
  );
}
