import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Button, Chip, MenuItem, TextField } from '@mui/material';
import { Tune } from '@mui/icons-material';

import DataTable from '@/components/common/DataTable';
import PageHeader from '@/components/common/PageHeader';
import { useApi } from '@/hooks/useApi';
import { formatDate } from '@/lib/format';
import { fetchProducts } from '@/store/slices/productSlice';

import StockAdjustmentDialog from './StockAdjustmentDialog';

const TYPE_COLORS = { purchase: 'success', sale: 'info', adjustment: 'warning' };

const columns = [
  { label: 'Date', render: (m) => formatDate(m.createdAt) },
  {
    label: 'Product',
    render: (m) => m.product_id?.productName ?? 'Deleted product',
    search: (m) => m.product_id?.productName,
  },
  {
    label: 'Type',
    render: (m) => <Chip size="small" label={m.type} color={TYPE_COLORS[m.type]} />,
    search: (m) => m.type,
  },
  {
    label: 'Change',
    align: 'right',
    render: (m) => (
      <Box component="span" sx={{ color: m.quantity < 0 ? 'error.main' : 'success.main' }}>
        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
      </Box>
    ),
  },
  { label: 'Balance', align: 'right', render: (m) => m.balance },
  { label: 'Note', render: (m) => m.note, search: (m) => m.note },
];

/** The stock ledger: every change to every product's stock, newest first. */
export default function StockLedgerPage() {
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.products);
  const [productId, setProductId] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const query = productId ? `?productId=${productId}` : '';
  const { data, loading, error, reload } = useApi(`/api/user/stock/movements${query}`);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const handleSaved = () => {
    setAdjusting(false);
    reload();
    dispatch(fetchProducts());
  };

  return (
    <>
      <PageHeader
        title="Stock ledger"
        subtitle="Every change to stock: approved purchases, approved invoices and manual adjustments."
        actions={
          <Button variant="contained" startIcon={<Tune />} onClick={() => setAdjusting(true)}>
            Adjust stock
          </Button>
        }
      />

      <TextField
        select
        label="Product"
        value={productId}
        onChange={(event) => setProductId(event.target.value)}
        SelectProps={{ displayEmpty: true }}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2, maxWidth: 360 }}
      >
        <MenuItem value="">All products</MenuItem>
        {products.map((p) => (
          <MenuItem key={p._id} value={p._id}>
            {p.productName}
          </MenuItem>
        ))}
      </TextField>

      <DataTable
        columns={columns}
        rows={data}
        loading={loading}
        error={error}
        emptyText="No stock movements yet. Approve a purchase to add stock."
      />

      {adjusting && (
        <StockAdjustmentDialog
          open
          products={products}
          productId={productId || undefined}
          onClose={() => setAdjusting(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
