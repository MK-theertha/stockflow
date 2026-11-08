import { useNavigate } from 'react-router-dom';
import { IconButton, Tooltip } from '@mui/material';
import { Visibility } from '@mui/icons-material';

import DataTable from '@/components/common/DataTable';
import PageHeader from '@/components/common/PageHeader';
import { usePagedApi } from '@/hooks/usePagedApi';
import { formatDate, formatMoney } from '@/lib/format';

/** Approved invoices that have been paid in full. */
export default function PaidInvoicesPage() {
  const navigate = useNavigate();
  const list = usePagedApi('/api/user/paidcustomer');

  const columns = [
    {
      label: 'Invoice',
      render: (p) => p.invoice_id?.invoice_no,
      search: (p) => p.invoice_id?.invoice_no,
    },
    { label: 'Date', render: (p) => formatDate(p.invoice_id?.date) },
    { label: 'Customer', render: (p) => p.customer_id?.name, search: (p) => p.customer_id?.name },
    { label: 'Amount', align: 'right', render: (p) => formatMoney(p.total_amount) },
    {
      label: 'Actions',
      align: 'right',
      render: (p) => (
        <Tooltip title="View invoice">
          <IconButton
            size="small"
            onClick={() => navigate(`/dashboard/user/invoices/${p.invoice_id?._id}`)}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Paid invoices" subtitle="Approved invoices with nothing left to pay." />
      <DataTable columns={columns} server={list} emptyText="No fully paid invoices yet." />
    </>
  );
}
