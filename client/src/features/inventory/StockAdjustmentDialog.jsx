import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import { useNotify } from '@/components/common/Notifications';
import { apiFetch } from '@/lib/api-client';

const REASONS = ['Damaged', 'Expired', 'Lost or stolen', 'Stock count correction', 'Returned'];

/** Adds or removes stock by hand. Every adjustment is recorded in the stock ledger. */
export default function StockAdjustmentDialog({ open, products, productId, onClose, onSaved }) {
  const notify = useNotify();
  const [form, setForm] = useState({
    productId: productId ?? '',
    direction: 'remove',
    quantity: '',
    reason: REASONS[0],
    note: '',
  });
  const [busy, setBusy] = useState(false);

  const set = (name) => (event) => setForm((prev) => ({ ...prev, [name]: event.target.value }));
  const product = products.find((p) => p._id === form.productId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const quantity = Number(form.quantity) * (form.direction === 'remove' ? -1 : 1);
    const note = form.note.trim() ? `${form.reason}: ${form.note.trim()}` : form.reason;

    setBusy(true);
    try {
      await apiFetch('/api/user/stock/adjustments', {
        method: 'POST',
        body: { productId: form.productId, quantity, note },
      });
      notify.success('Stock adjusted');
      onSaved();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Adjust stock</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Product"
              required
              value={form.productId}
              onChange={set('productId')}
            >
              {products.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.productName} (in stock: {p.quantity})
                </MenuItem>
              ))}
            </TextField>

            <ToggleButtonGroup
              exclusive
              value={form.direction}
              onChange={(event, value) =>
                value && setForm((prev) => ({ ...prev, direction: value }))
              }
              size="small"
            >
              <ToggleButton value="remove">Remove stock</ToggleButton>
              <ToggleButton value="add">Add stock</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label="Quantity"
              type="number"
              required
              inputProps={{ min: 1, step: 1 }}
              value={form.quantity}
              onChange={set('quantity')}
              helperText={
                product && form.quantity
                  ? `New stock will be ${
                      product.quantity +
                      Number(form.quantity) * (form.direction === 'remove' ? -1 : 1)
                    }`
                  : undefined
              }
            />

            <TextField select label="Reason" value={form.reason} onChange={set('reason')}>
              {REASONS.map((reason) => (
                <MenuItem key={reason} value={reason}>
                  {reason}
                </MenuItem>
              ))}
            </TextField>

            <TextField label="Note (optional)" value={form.note} onChange={set('note')} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy}>
            Save adjustment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
