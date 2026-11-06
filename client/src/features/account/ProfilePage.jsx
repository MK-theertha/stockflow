import { useEffect, useState } from 'react';
import { Alert, Avatar, Button, CircularProgress, Paper, Stack, TextField } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';

import { useNotify } from '@/components/common/Notifications';
import PageHeader from '@/components/common/PageHeader';
import { useApi } from '@/hooks/useApi';
import { apiFetch } from '@/lib/api-client';
import { useSession } from '@/lib/session';
import { uploadImage, uploadsEnabled } from '@/lib/uploads';

export default function ProfilePage() {
  const notify = useNotify();
  const { refresh } = useSession();
  const { data: profile, loading, error } = useApi('/api/user/profile');
  const [form, setForm] = useState({ name: '', phone: '', image: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name, phone: profile.phone ?? '', image: profile.image ?? '' });
    }
  }, [profile]);

  const set = (name) => (event) => setForm((prev) => ({ ...prev, [name]: event.target.value }));

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const image = await uploadImage(file);
      setForm((prev) => ({ ...prev, image }));
    } catch (uploadError) {
      notify.error(uploadError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await apiFetch('/api/user/profile', { method: 'PUT', body: form });
      await refresh();
      notify.success('Profile saved');
    } catch (saveError) {
      notify.error(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account details." />
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 520 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={form.image || undefined} sx={{ width: 72, height: 72 }}>
                {form.name.charAt(0)}
              </Avatar>
              {uploadsEnabled && (
                <Button component="label" startIcon={<PhotoCamera />} disabled={busy}>
                  Change photo
                  <input hidden type="file" accept="image/*" onChange={handleImage} />
                </Button>
              )}
            </Stack>
            <TextField label="Name" required value={form.name} onChange={set('name')} />
            <TextField
              label="Email"
              value={profile.email}
              disabled
              helperText="Email cannot be changed."
            />
            <TextField label="Phone" value={form.phone} onChange={set('phone')} />
            {!uploadsEnabled && (
              <TextField label="Photo URL" value={form.image} onChange={set('image')} />
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={busy}
              sx={{ alignSelf: 'flex-start' }}
            >
              Save
            </Button>
          </Stack>
        </form>
      </Paper>
    </>
  );
}
