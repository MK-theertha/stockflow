import { forwardRef } from 'react';
import {
  Box,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { APP_NAME } from '@/lib/brand';
import { formatDate, formatMoney } from '@/lib/format';

import { PAYMENT_STATUS } from './status';

function Total({ label, value, strong }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 400 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 400 }}>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * The invoice as a customer would see it. Kept free of buttons so it can be
 * printed as is with printElement().
 */
const InvoiceDocument = forwardRef(function InvoiceDocument({ details }, ref) {
  const [invoice] = details.invoice;
  const [payment] = details.payment;
  const customer = payment?.customer_id;
  const subtotal = details.invoicedetails.reduce((sum, line) => sum + line.selling_price, 0);

  return (
    <Paper ref={ref} variant="outlined" sx={{ p: { xs: 2, md: 4 } }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {APP_NAME}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tax invoice
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {invoice.invoice_no}
          </Typography>
          <Typography variant="body2">Date: {formatDate(invoice.date)}</Typography>
          <Typography variant="body2">
            Status: {invoice.status ? 'Approved' : 'Pending approval'}
          </Typography>
        </Grid>
      </Grid>

      <Typography variant="overline" color="text.secondary">
        Bill to
      </Typography>
      <Typography variant="subtitle1">{customer?.name}</Typography>
      <Typography variant="body2">{customer?.email}</Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        {customer?.mobileNumber}
      </Typography>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Item</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Unit price</TableCell>
            <TableCell align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {details.invoicedetails.map((line, index) => (
            <TableRow key={line._id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{line.product_id?.productName ?? 'Deleted product'}</TableCell>
              <TableCell align="right">{line.selling_qty}</TableCell>
              <TableCell align="right">{formatMoney(line.unit_price)}</TableCell>
              <TableCell align="right">{formatMoney(line.selling_price)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box sx={{ ml: 'auto', mt: 2, maxWidth: 300 }}>
        <Total label="Subtotal" value={formatMoney(subtotal)} />
        <Total label="Discount" value={`− ${formatMoney(payment?.discount_amount)}`} />
        <Divider sx={{ my: 0.5 }} />
        <Total label="Total" value={formatMoney(payment?.total_amount)} strong />
        <Total label="Paid" value={formatMoney(payment?.paid_amount)} />
        <Total label="Due" value={formatMoney(payment?.due_amount)} strong />
        <Typography variant="caption" color="text.secondary">
          {PAYMENT_STATUS[payment?.paid_status]?.label}
        </Typography>
      </Box>

      {invoice.description && (
        <Typography variant="body2" sx={{ mt: 3 }}>
          Note: {invoice.description}
        </Typography>
      )}
    </Paper>
  );
});

export default InvoiceDocument;
