import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Button, Chip, IconButton, Tab, Tabs, Tooltip } from '@mui/material';
import { Add, Delete, Visibility } from '@mui/icons-material';

import ConfirmDialog from '@/components/common/ConfirmDialog';
import DataTable from '@/components/common/DataTable';
import { useNotify } from '@/components/common/Notifications';
import PageHeader from '@/components/common/PageHeader';
import { usePagedApi } from '@/hooks/usePagedApi';
import { apiFetch } from '@/lib/api-client';
import { formatDate, formatMoney } from '@/lib/format';

import { PAYMENT_STATUS, approvalStatus } from './status';

/**
 * Every invoice, one row per invoice (the payment record carries the totals).
 * `initialFilter="pending"` turns it into the approval queue.
 */
export default function InvoiceListPage({ initialFilter = 'all' }) {
  const navigate = useNavigate();
  const notify = useNotify();
  const [filter, setFilter] = useState(initialFilter);
  const list = usePagedApi('/api/user/payment', {
    status: filter === 'all' ? undefined : filter,
  });
  const [deleting, setDeleting] = useState(null);

  const open = (payment) => navigate(`/dashboard/user/invoices/${payment.invoice_id?._id}`);

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/user/invoice/${deleting.invoice_id?._id}`, { method: 'DELETE' });
      notify.success('Invoice deleted');
      setDeleting(null);
      list.reload();
    } catch (deleteError) {
      notify.error(deleteError.message);
    }
  };

  const columns = [
    {
      label: 'Invoice',
      render: (p) => p.invoice_id?.invoice_no,
      search: (p) => p.invoice_id?.invoice_no,
    },
    { label: 'Date', render: (p) => formatDate(p.invoice_id?.date) },
    { label: 'Customer', render: (p) => p.customer_id?.name, search: (p) => p.customer_id?.name },
    { label: 'Total', align: 'right', render: (p) => formatMoney(p.total_amount) },
    { label: 'Due', align: 'right', render: (p) => formatMoney(p.due_amount) },
    {
      label: 'Status',
      render: (p) => <Chip size="small" {...approvalStatus(p.invoice_id?.status)} />,
    },
    {
      label: 'Payment',
      render: (p) => <Chip size="small" variant="outlined" {...PAYMENT_STATUS[p.paid_status]} />,
    },
    {
      label: 'Actions',
      align: 'right',
      render: (p) => (
        <>
          <Tooltip title={p.invoice_id?.status ? 'View' : 'View and approve'}>
            <IconButton size="small" onClick={() => open(p)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
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
        title={initialFilter === 'pending' ? 'Approve invoices' : 'Invoices'}
        subtitle="Open a pending invoice to check it and approve it. Approving deducts the stock."
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            component={RouterLink}
            to="/dashboard/user/invoices/new"
          >
            New invoice
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
        server={list}
        emptyText={filter === 'pending' ? 'Nothing waiting for approval.' : 'No invoices yet.'}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete invoice"
        message={
          deleting?.invoice_id?.status
            ? `Delete ${deleting.invoice_id.invoice_no}? It is approved, so its items go back into stock.`
            : `Delete ${deleting?.invoice_id?.invoice_no}?`
        }
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
