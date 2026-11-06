import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import LineItemsEditor, { emptyLine, lineTotal } from '@/components/common/LineItemsEditor';
import { useNotify } from '@/components/common/Notifications';
import PageHeader from '@/components/common/PageHeader';
import { apiFetch } from '@/lib/api-client';
import { formatMoney, toInputDate } from '@/lib/format';
import { fetchCustomers } from '@/store/slices/customerSlice';
import { fetchProducts } from '@/store/slices/productSlice';

const NEW_CUSTOMER = 'new_customer';

const PAYMENT_OPTIONS = [
  { value: 'full_paid', label: 'Paid in full' },
  { value: 'partial_paid', label: 'Part paid' },
  { value: 'full_due', label: 'Not paid yet' },
];

function SummaryRow({ label, value, strong }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant={strong ? 'subtitle1' : 'body2'} sx={{ fontWeight: strong ? 700 : 400 }}>
        {label}
      </Typography>
      <Typography variant={strong ? 'subtitle1' : 'body2'} sx={{ fontWeight: strong ? 700 : 400 }}>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * Creates a pending invoice. Stock is only deducted when the invoice is approved,
 * and the server recalculates every total, so the numbers here are a preview.
 */
export default function CreateInvoicePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notify = useNotify();
  const { products } = useSelector((state) => state.products);
  const { customers } = useSelector((state) => state.customers);

  const [customerId, setCustomerId] = useState(NEW_CUSTOMER);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [date, setDate] = useState(toInputDate());
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [discount, setDiscount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('full_paid');
  const [paidAmount, setPaidAmount] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchCustomers());
  }, [dispatch]);

  const subtotal = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const paid =
    paymentStatus === 'full_paid'
      ? total
      : paymentStatus === 'full_due'
        ? 0
        : Number(paidAmount) || 0;

  const setNew = (field) => (event) =>
    setNewCustomer((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const invoice = await apiFetch('/api/user/invoice', {
        method: 'POST',
        body: {
          date,
          description,
          selectedCustomer: customerId,
          ...(customerId === NEW_CUSTOMER ? newCustomer : {}),
          discount: Number(discount) || 0,
          status: paymentStatus,
          partialAmount: paymentStatus === 'partial_paid' ? Number(paidAmount) || 0 : 0,
          purchaseData: lines.map((line) => ({
            selectedProduct: line.productId,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
          })),
        },
      });
      notify.success(`Invoice ${invoice.invoice_no} created. Approve it to deduct stock.`);
      if (customerId === NEW_CUSTOMER) dispatch(fetchCustomers());
      navigate(`/dashboard/user/invoices/${invoice._id}`);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New invoice"
        subtitle="The invoice starts as pending. Stock is deducted when you approve it."
      />
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Customer
              </Typography>
              <Stack spacing={2}>
                <TextField
                  select
                  label="Customer"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                >
                  <MenuItem value={NEW_CUSTOMER}>+ New customer</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer._id} value={customer._id}>
                      {customer.name} ({customer.email})
                    </MenuItem>
                  ))}
                </TextField>
                {customerId === NEW_CUSTOMER && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Name"
                      required
                      value={newCustomer.name}
                      onChange={setNew('name')}
                    />
                    <TextField
                      label="Email"
                      type="email"
                      required
                      value={newCustomer.email}
                      onChange={setNew('email')}
                    />
                    <TextField
                      label="Phone"
                      type="number"
                      required
                      value={newCustomer.phone}
                      onChange={setNew('phone')}
                    />
                  </Stack>
                )}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Date"
                    type="date"
                    required
                    InputLabelProps={{ shrink: true }}
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                  <TextField
                    label="Note (optional)"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </Stack>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Items
              </Typography>
              <LineItemsEditor lines={lines} onChange={setLines} products={products} showStock />
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper variant="outlined" sx={{ p: 2.5, position: { lg: 'sticky' }, top: { lg: 88 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Payment
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Discount"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                />
                <TextField
                  select
                  label="Payment"
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value)}
                >
                  {PAYMENT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                {paymentStatus === 'partial_paid' && (
                  <TextField
                    label="Amount paid now"
                    type="number"
                    required
                    inputProps={{ min: 0, max: total, step: 0.01 }}
                    value={paidAmount}
                    onChange={(event) => setPaidAmount(event.target.value)}
                  />
                )}
              </Stack>

              <Divider sx={{ my: 2 }} />
              <SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
              <SummaryRow label="Discount" value={`− ${formatMoney(discount)}`} />
              <SummaryRow label="Total" value={formatMoney(total)} strong />
              <SummaryRow label="Paid now" value={formatMoney(paid)} />
              <SummaryRow label="Due" value={formatMoney(Math.max(0, total - paid))} />

              <Button type="submit" variant="contained" fullWidth disabled={busy} sx={{ mt: 2 }}>
                Create invoice
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </>
  );
}
