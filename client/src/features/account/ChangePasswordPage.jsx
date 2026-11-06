import { useState } from 'react';
import { Button, Paper, Stack, TextField } from '@mui/material';

import { useNotify } from '@/components/common/Notifications';
import PageHeader from '@/components/common/PageHeader';
import { apiFetch } from '@/lib/api-client';

const EMPTY = { oldPassword: '', newPassword: '', confirmPassword: '' };

export default function ChangePasswordPage() {
  const notify = useNotify();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const set = (name) => (event) => setForm((prev) => ({ ...prev, [name]: event.target.value }));
  const mismatch = form.confirmPassword !== '' && form.confirmPassword !== form.newPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (mismatch) return;
    setBusy(true);
    try {
      await apiFetch('/api/user/change-password', {
        method: 'POST',
        body: { oldPassword: form.oldPassword, newPassword: form.newPassword },
      });
      notify.success('Password changed');
      setForm(EMPTY);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Change password" />
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <TextField
              label="Current password"
              type="password"
              autoComplete="current-password"
              required
              value={form.oldPassword}
              onChange={set('oldPassword')}
            />
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              required
              inputProps={{ minLength: 6 }}
              helperText="At least 6 characters."
              value={form.newPassword}
              onChange={set('newPassword')}
            />
            <TextField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              required
              error={mismatch}
              helperText={mismatch ? 'Passwords do not match' : ' '}
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={busy || mismatch}
              sx={{ alignSelf: 'flex-start' }}
            >
              Change password
            </Button>
          </Stack>
        </form>
      </Paper>
    </>
  );
}
