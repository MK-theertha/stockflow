import { Chip } from '@mui/material';

import DataTable from '@/components/common/DataTable';
import PageHeader from '@/components/common/PageHeader';
import { useApi } from '@/hooks/useApi';
import { formatDate } from '@/lib/format';

const columns = [
  { label: 'Shop', render: (s) => s.name, search: (s) => s.name },
  { label: 'Email', render: (s) => s.email, search: (s) => s.email },
  { label: 'Phone', render: (s) => s.phone },
  { label: 'Joined', render: (s) => formatDate(s.createdAt) },
  {
    label: 'Subscription',
    render: (s) =>
      s.subscriptionEnd ? (
        <Chip
          size="small"
          color={s.active ? 'success' : 'default'}
          label={`${s.active ? 'Active until' : 'Expired'} ${formatDate(s.subscriptionEnd)}`}
        />
      ) : (
        <Chip size="small" label="Never subscribed" variant="outlined" />
      ),
    search: (s) => (s.active ? 'active' : 'expired'),
  },
  { label: 'Products', align: 'right', render: (s) => s.products },
  { label: 'Invoices', align: 'right', render: (s) => s.invoices },
];

/** Every registered shop, for the platform admin. */
export default function ShopsPage() {
  const { data, loading, error } = useApi('/api/admin/shops');

  return (
    <>
      <PageHeader title="Shops" subtitle="Every business using StockFlow." />
      <DataTable
        columns={columns}
        rows={data}
        loading={loading}
        error={error}
        emptyText="No shops yet."
      />
    </>
  );
}
