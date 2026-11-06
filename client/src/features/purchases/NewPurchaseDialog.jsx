import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import LineItemsEditor, { emptyLine, lineTotal } from '@/components/common/LineItemsEditor';
import { useNotify } from '@/components/common/Notifications';
import { apiFetch } from '@/lib/api-client';
import { formatMoney, toInputDate } from '@/lib/format';

const suggestNumber = () => `P-${toInputDate().replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;

/**
 * Records goods bought from one supplier. Each line becomes one pending purchase;
 * stock is added when a purchase is approved.
 */
export default function NewPurchaseDialog({ suppliers, products, onClose, onSaved }) {
  const notify = useNotify();
  const [form, setForm] = useState({
    purchaseNo: suggestNumber(),
    supplierId: '',
    date: toInputDate(),
    note: '',
  });
  const [lines, setLines] = useState([emptyLine()]);
  const [busy, setBusy] = useState(false);

  const set = (name) => (event) => setForm((prev) => ({ ...prev, [name]: event.target.value }));

  // Prefer the products this supplier supplies; fall back to all of them.
  const supplierProducts = products.filter((p) => p.supplierNameId?._id === form.supplierId);
  const choices = supplierProducts.length ? supplierProducts : products;
  const total = lines.reduce((sum, line) => sum + lineTotal(line), 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await apiFetch('/api/user/purchases', {
        method: 'POST',
        body: lines.map((line) => ({
          purchaseNo: form.purchaseNo,
          supplierName: form.supplierId,
          selectedProduct: line.productId,
          startDate: form.date,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unitPrice),
          description: form.note || undefined,
        })),
      });
      notify.success('Purchase saved. Approve it to add the stock.');
      onSaved();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>New purchase</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Purchase no."
                required
                value={form.purchaseNo}
                onChange={set('purchaseNo')}
              />
              <TextField
                select
                label="Supplier"
                required
                value={form.supplierId}
                onChange={set('supplierId')}
              >
                {suppliers.map((supplier) => (
                  <MenuItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Date"
                type="date"
                required
                InputLabelProps={{ shrink: true }}
                value={form.date}
                onChange={set('date')}
              />
            </Stack>
            <TextField label="Note (optional)" value={form.note} onChange={set('note')} />
            <LineItemsEditor lines={lines} onChange={setLines} products={choices} />
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Total {formatMoney(total)}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy}>
            Save purchase
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
