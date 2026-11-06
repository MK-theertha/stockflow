import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Chip, IconButton, Tab, Tabs, Tooltip } from '@mui/material';
import { Add, Delete, TaskAlt } from '@mui/icons-material';

import ConfirmDialog from '@/components/common/ConfirmDialog';
import DataTable from '@/components/common/DataTable';
import { useNotify } from '@/components/common/Notifications';
import PageHeader from '@/components/common/PageHeader';
import { approvalStatus } from '@/features/sales/status';
import { useApi } from '@/hooks/useApi';
import { apiFetch } from '@/lib/api-client';
import { formatDate, formatMoney } from '@/lib/format';
import { fetchProducts } from '@/store/slices/productSlice';
import { fetchSuppliers } from '@/store/slices/supplierSlice';

import NewPurchaseDialog from './NewPurchaseDialog';

const FILTERS = {
  all: () => true,
  pending: (purchase) => !purchase.status,
  approved: (purchase) => purchase.status,
};

/** Goods bought from suppliers. Approving a purchase adds its quantity to stock. */
export default function PurchasesPage() {
  const dispatch = useDispatch();
  const notify = useNotify();
  const { products } = useSelector((state) => state.products);
  const { suppliers } = useSelector((state) => state.suppliers);
  const { data, loading, error, reload } = useApi('/api/user/purchases');
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchSuppliers());
  }, [dispatch]);

  // Every change here affects stock, so refresh the product list as well.
  const refresh = () => {
    reload();
    dispatch(fetchProducts());
  };

  const approve = async (purchase) => {
    try {
      await apiFetch(`/api/user/purchases/${purchase._id}`, { method: 'PUT' });
      notify.success(`Added ${purchase.buying_qty} to stock`);
      refresh();
    } catch (error) {
      notify.error(error.message);
    }
  };

  const remove = async () => {
    try {
      await apiFetch(`/api/user/purchases/${deleting._id}`, { method: 'DELETE' });
      notify.success('Purchase deleted');
      setDeleting(null);
      refresh();
    } catch (error) {
      notify.error(error.message);
    }
  };

  const columns = [
    { label: 'Purchase no.', render: (p) => p.purchase_no, search: (p) => p.purchase_no },
    { label: 'Date', render: (p) => formatDate(p.date) },
    { label: 'Supplier', render: (p) => p.supplier_id?.name, search: (p) => p.supplier_id?.name },
    {
      label: 'Product',
      render: (p) => p.product_id?.productName ?? 'Deleted product',
      search: (p) => p.product_id?.productName,
    },
    { label: 'Qty', align: 'right', render: (p) => p.buying_qty },
    { label: 'Unit price', align: 'right', render: (p) => formatMoney(p.unit_price) },
    { label: 'Total', align: 'right', render: (p) => formatMoney(p.buying_price) },
    { label: 'Status', render: (p) => <Chip size="small" {...approvalStatus(p.status)} /> },
    {
      label: 'Actions',
      align: 'right',
      render: (p) => (
        <>
          {!p.status && (
            <Tooltip title="Approve: add to stock">
              <IconButton size="small" color="success" onClick={() => approve(p)}>
                <TaskAlt fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleting(p)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Purchases"
        subtitle="Stock bought from suppliers. Approve a purchase when the goods arrive."
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => setAdding(true)}>
            New purchase
          </Button>
        }
      />

      <Tabs value={filter} onChange={(event, value) => setFilter(value)} sx={{ mb: 2 }}>
        <Tab value="all" label="All" />
        <Tab value="pending" label="Pending" />
        <Tab value="approved" label="Approved" />
      </Tabs>

      <DataTable
        columns={columns}
        rows={(data ?? []).filter(FILTERS[filter])}
        loading={loading}
        error={error}
        emptyText='No purchases yet. Click "New purchase" to record one.'
      />

      {adding && (
        <NewPurchaseDialog
          suppliers={suppliers}
          products={products}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete purchase"
        message={
          deleting?.status
            ? `${deleting.purchase_no} is approved, so ${deleting.buying_qty} will be taken back out of stock.`
            : `Delete ${deleting?.purchase_no}?`
        }
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
