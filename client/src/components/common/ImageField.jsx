import { useState } from 'react';
import { Avatar, Button, CircularProgress, Stack, TextField } from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';

import { useNotify } from '@/components/common/Notifications';
import { uploadImage, uploadsEnabled } from '@/lib/uploads';

/**
 * A photo: uploads to Cloudinary when configured, otherwise lets you paste a URL.
 * `value` is the image URL ('' for none).
 */
export default function ImageField({ label, value, onChange }) {
  const notify = useNotify();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file));
    } catch (error) {
      notify.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar src={value || undefined} sx={{ width: 56, height: 56 }} />
      {uploadsEnabled ? (
        <Button component="label" startIcon={<PhotoCamera />} disabled={uploading}>
          {uploading ? <CircularProgress size={18} /> : `Upload ${label.toLowerCase()}`}
          <input hidden type="file" accept="image/*" onChange={handleFile} />
        </Button>
      ) : (
        <TextField
          label={`${label} URL`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Stack>
  );
}
