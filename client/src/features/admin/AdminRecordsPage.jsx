import { useMemo } from 'react';
import { Chip } from '@mui/material';

import DataTable from '@/components/common/DataTable';
import PageHeader from '@/components/common/PageHeader';
import { approvalStatus, PAYMENT_STATUS } from '@/features/sales/status';
import { useApi } from '@/hooks/useApi';
import { formatDate, formatMoney } from '@/lib/format';

// Read-only views of every shop's records. Admins call the same /api/user
// endpoints as shops; ownedBy() simply does not filter for them.
const RESOURCES = {
  products: {
    title: 'All products',
    endpoint: '/api/user/products',
    columns: [
      { label: 'Product', render: (p) => p.productName, search: (p) => p.productName },
      { label: 'Supplier', render: (p) => p.supplierNameId?.name },
      { label: 'Category', render: (p) => p.categoryNameId?.name },
      { label: 'In stock', align: 'right', render: (p) => p.quantity },
    ],
  },
  purchases: {
    title: 'All purchases',
    endpoint: '/api/user/purchases',
    columns: [
      { label: 'Purchase no.', render: (p) => p.purchase_no, search: (p) => p.purchase_no },
      { label: 'Date', render: (p) => formatDate(p.date) },
      { label: 'Product', render: (p) => p.product_id?.productName },
      { label: 'Qty', align: 'right', render: (p) => p.buying_qty },
      { label: 'Total', align: 'right', render: (p) => formatMoney(p.buying_price) },
      { label: 'Status', render: (p) => <Chip size="small" {...approvalStatus(p.status)} /> },
    ],
  },
  invoices: {
    title: 'All invoices',
    endpoint: '/api/user/payment',
    columns: [
      {
        label: 'Invoice',
        render: (p) => p.invoice_id?.invoice_no,
        search: (p) => p.invoice_id?.invoice_no,
      },
      { label: 'Date', render: (p) => formatDate(p.invoice_id?.date) },
      { label: 'Customer', render: (p) => p.customer_id?.name, search: (p) => p.customer_id?.name },
      { label: 'Total', align: 'right', render: (p) => formatMoney(p.total_amount) },
      {
        label: 'Status',
        render: (p) => <Chip size="small" {...approvalStatus(p.invoice_id?.status)} />,
      },
      {
        label: 'Payment',
        render: (p) => <Chip size="small" variant="outlined" {...PAYMENT_STATUS[p.paid_status]} />,
      },
    ],
  },
  suppliers: {
    title: 'All suppliers',
    endpoint: '/api/user/supplier',
    columns: [
      { label: 'Name', render: (s) => s.name, search: (s) => s.name },
      { label: 'Email', render: (s) => s.email, search: (s) => s.email },
      { label: 'Phone', render: (s) => s.phone },
    ],
  },
  categories: {
    title: 'All categories',
    endpoint: '/api/user/category',
    columns: [{ label: 'Name', render: (c) => c.name, search: (c) => c.name }],
  },
  units: {
    title: 'All units',
    endpoint: '/api/user/unit',
    columns: [{ label: 'Name', render: (u) => u.name, search: (u) => u.name }],
  },
};

export default function AdminRecordsPage({ resource }) {
  const { title, endpoint, columns } = RESOURCES[resource];
  const { data, loading, error } = useApi(endpoint);
  const { data: shops } = useApi('/api/admin/shops');

  // Which shop owns each record.
  const withShop = useMemo(() => {
    const names = new Map((shops ?? []).map((shop) => [shop._id, shop.name]));
    const shopName = (row) => names.get(row.userId) ?? '—';
    return [{ label: 'Shop', render: shopName, search: shopName }, ...columns];
  }, [shops, columns]);

  return (
    <>
      <PageHeader title={title} subtitle="Every shop's records. Read only." />
      <DataTable columns={withShop} rows={data} loading={loading} error={error} />
    </>
  );
}
