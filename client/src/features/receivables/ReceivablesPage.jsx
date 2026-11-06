import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Chip, Grid, IconButton, Tooltip } from '@mui/material';
import { History, Payments, Print, Visibility } from '@mui/icons-material';

import DataTable from '@/components/common/DataTable';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import { useApi } from '@/hooks/useApi';
import { formatMoney } from '@/lib/format';

import CollectPaymentDialog from './CollectPaymentDialog';
import PaymentHistoryDialog from './PaymentHistoryDialog';

const STATUS = {
  full_due: { label: 'Unpaid', color: 'error' },
  partial_paid: { label: 'Partly paid', color: 'warning' },
};

/** Accounts receivable: invoices where the customer still owes money. */
export default function ReceivablesPage() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi('/api/user/creditcustomer');
  const [collecting, setCollecting] = useState(null);
  const [viewing, setViewing] = useState(null);

  const rows = data ?? [];
  const totalDue = rows.reduce((sum, row) => sum + (row.due_amount ?? 0), 0);
  const customers = new Set(rows.map((row) => row.customer_id?._id)).size;

  const columns = [
    {
      label: 'Invoice',
      render: (p) => p.invoice_id?.invoice_no,
      search: (p) => p.invoice_id?.invoice_no,
    },
    { label: 'Customer', render: (p) => p.customer_id?.name, search: (p) => p.customer_id?.name },
    { label: 'Total', align: 'right', render: (p) => formatMoney(p.total_amount) },
    { label: 'Paid', align: 'right', render: (p) => formatMoney(p.paid_amount) },
    { label: 'Due', align: 'right', render: (p) => formatMoney(p.due_amount) },
    {
      label: 'Status',
      render: (p) => <Chip size="small" {...STATUS[p.paid_status]} />,
    },
    {
      label: 'Actions',
      align: 'right',
      render: (p) => (
        <>
          <Tooltip title="Collect payment">
            <IconButton size="small" color="primary" onClick={() => setCollecting(p)}>
              <Payments fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Payment history">
            <IconButton size="small" onClick={() => setViewing(p)}>
              <History fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View invoice">
            <IconButton
              size="small"
              onClick={() => navigate(`/dashboard/user/invoices/${p.invoice_id?._id}`)}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Receivables"
        subtitle="Money customers still owe you. Collect payments as they come in."
        actions={
          <Button startIcon={<Print />} onClick={() => window.print()}>
            Print
          </Button>
        }
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard label="Total due" value={formatMoney(totalDue)} color="error.main" />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard label="Open invoices" value={rows.length} />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard label="Customers owing" value={customers} />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        emptyText="No money is owed to you right now."
      />

      {collecting && (
        <CollectPaymentDialog
          payment={collecting}
          onClose={() => setCollecting(null)}
          onSaved={() => {
            setCollecting(null);
            reload();
          }}
        />
      )}
      {viewing && <PaymentHistoryDialog payment={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
