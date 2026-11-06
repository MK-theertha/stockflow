import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Paper, Stack, Typography } from '@mui/material';
import { Logout } from '@mui/icons-material';

import { useNotify } from '@/components/common/Notifications';
import PageHeader from '@/components/common/PageHeader';
import { useSession } from '@/lib/session';

export default function LogoutPage() {
  const navigate = useNavigate();
  const notify = useNotify();
  const { data: session, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const user = session?.user;

  const handleLogout = async () => {
    setBusy(true);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      notify.error(error.message);
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Log out" />
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 420 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Avatar src={user?.image || undefined} sx={{ width: 56, height: 56 }}>
            {user?.name?.charAt(0)}
          </Avatar>
          <div>
            <Typography variant="subtitle1">{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </div>
        </Stack>
        <Button
          variant="contained"
          color="error"
          startIcon={<Logout />}
          onClick={handleLogout}
          disabled={busy}
        >
          Log out of this browser
        </Button>
      </Paper>
    </>
  );
}
