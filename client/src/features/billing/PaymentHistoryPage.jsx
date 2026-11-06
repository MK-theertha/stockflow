import { Chip } from '@mui/material';

import DataTable from '@/components/common/DataTable';
import PageHeader from '@/components/common/PageHeader';
import { useApi } from '@/hooks/useApi';
import { formatDate, formatMoney } from '@/lib/format';

const columns = [
  { label: 'Date', render: (order) => formatDate(order.createdAt) },
  {
    label: 'Transaction',
    render: (order) => order.transactionId,
    search: (order) => order.transactionId,
  },
  { label: 'Method', render: (order) => order.paymentMethod },
  {
    label: 'Status',
    render: (order) => (
      <Chip
        size="small"
        color={order.paymentStatus === 'Paid' ? 'success' : 'default'}
        label={order.paymentStatus}
      />
    ),
  },
  { label: 'Amount', align: 'right', render: (order) => formatMoney(order.totalPrice) },
];

/** Subscription payments the shop has made through Stripe. */
export default function PaymentHistoryPage() {
  const { data, loading, error } = useApi('/api/user/orders');

  return (
    <>
      <PageHeader title="Payment history" subtitle="Your StockFlow subscription payments." />
      <DataTable
        columns={columns}
        rows={data}
        loading={loading}
        error={error}
        emptyText="No payments yet."
      />
    </>
  );
}
