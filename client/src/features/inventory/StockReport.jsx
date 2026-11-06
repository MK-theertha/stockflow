import { Chip } from '@mui/material';

import DataTable from '@/components/common/DataTable';
import ReportLayout, { TotalRow } from '@/features/reports/ReportLayout';
import { useApi } from '@/hooks/useApi';
import { formatDate } from '@/lib/format';

const stockStatus = (p) => {
  if (p.quantity === 0) return { label: 'Out of stock', color: 'error' };
  if (p.reorderLevel > 0 && p.quantity <= p.reorderLevel) return { label: 'Low', color: 'warning' };
  return { label: 'OK', color: 'success' };
};

const columns = [
  { label: 'Product', render: (p) => p.productName, search: (p) => p.productName },
  {
    label: 'Category',
    render: (p) => p.categoryNameId?.name,
    search: (p) => p.categoryNameId?.name,
  },
  { label: 'Status', render: (p) => <Chip size="small" {...stockStatus(p)} /> },
  { label: 'Reorder level', align: 'right', render: (p) => p.reorderLevel || '' },
  { label: 'In stock', align: 'right', render: (p) => p.quantity },
];

/** Current stock of every product, ready to print for a stock count. */
export default function StockReport() {
  const { data, loading, error } = useApi('/api/user/stockreport');

  return (
    <ReportLayout
      title="Stock report"
      subtitle="Current stock of every product."
      printSubtitle={`As of ${formatDate(new Date())}`}
    >
      <DataTable
        columns={columns}
        rows={data}
        loading={loading}
        error={error}
        paginated={false}
        emptyText="No products yet."
        footer={
          data && (
            <TotalRow
              span={5}
              label={`${data.length} products`}
              values={[data.reduce((total, p) => total + p.quantity, 0)]}
            />
          )
        }
      />
    </ReportLayout>
  );
}
