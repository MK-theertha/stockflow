// Images are uploaded straight from the browser to Cloudinary with an unsigned
// upload preset, so they never pass through our API. We only store the URL.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export const uploadsEnabled = Boolean(CLOUD_NAME);

/** Uploads an image file and resolves with its public https URL. */
export async function uploadImage(file) {
  if (!uploadsEnabled)
    throw new Error('Image uploads are not configured (VITE_CLOUDINARY_CLOUD_NAME)');

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
    method: 'POST',
    body: form,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || 'Image upload failed');
  }
  return data.secure_url;
}
