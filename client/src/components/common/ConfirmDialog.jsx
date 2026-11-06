import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

/** "Are you sure?" dialog. Renders nothing while `open` is false. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  busy,
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
