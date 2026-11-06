import { Chip } from '@mui/material';

import DataTable from '@/components/common/DataTable';
import PageHeader from '@/components/common/PageHeader';
import { useApi } from '@/hooks/useApi';

const columns = [
  { label: 'Product', render: (p) => p.productName, search: (p) => p.productName },
  {
    label: 'Supplier',
    render: (p) => p.supplierNameId?.name,
    search: (p) => p.supplierNameId?.name,
  },
  {
    label: 'In stock',
    align: 'right',
    render: (p) => (
      <Chip size="small" color={p.quantity === 0 ? 'error' : 'warning'} label={p.quantity} />
    ),
  },
  { label: 'Reorder level', align: 'right', render: (p) => p.reorderLevel },
  { label: 'Unit', render: (p) => p.unitNameId?.name },
];

/** Products that need to be reordered from their supplier. */
export default function LowStockPage() {
  const { data, loading, error } = useApi('/api/user/stock/low');

  return (
    <>
      <PageHeader
        title="Low stock"
        subtitle="Products at or below their reorder level. Set a reorder level on the Products page."
      />
      <DataTable
        columns={columns}
        rows={data}
        loading={loading}
        error={error}
        emptyText="Nothing to reorder. All products are above their reorder level."
      />
    </>
  );
}
