import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useNotify } from '@/components/common/Notifications';
import { apiFetch } from '@/lib/api-client';
import { formatMoney, toInputDate } from '@/lib/format';

/** Records money received from a customer against an invoice with an amount due. */
export default function CollectPaymentDialog({ payment, onClose, onSaved }) {
  const notify = useNotify();
  const [amount, setAmount] = useState(String(payment.due_amount));
  const [date, setDate] = useState(toInputDate());
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await apiFetch(`/api/user/payment/${payment._id}/collect`, {
        method: 'POST',
        body: { amount: Number(amount), date },
      });
      notify.success(`Collected ${formatMoney(amount)}`);
      onSaved();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Collect payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {payment.customer_id?.name} · Invoice {payment.invoice_id?.invoice_no} · Due{' '}
            {formatMoney(payment.due_amount)}
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Amount received"
              type="number"
              required
              autoFocus
              inputProps={{ min: 0.01, max: payment.due_amount, step: 0.01 }}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <TextField
              label="Date"
              type="date"
              required
              InputLabelProps={{ shrink: true }}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy}>
            Record payment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
