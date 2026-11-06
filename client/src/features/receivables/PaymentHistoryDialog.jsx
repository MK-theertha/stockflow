import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';

import { useApi } from '@/hooks/useApi';
import { formatDate, formatMoney } from '@/lib/format';

/** Every amount received for one invoice. */
export default function PaymentHistoryDialog({ payment, onClose }) {
  const { data, loading } = useApi(`/api/user/payment/${payment._id}/history`);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Payments for {payment.invoice_id?.invoice_no}</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data ?? [])
                .filter((row) => row.current_paid_amount > 0)
                .map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell align="right">{formatMoney(row.current_paid_amount)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
