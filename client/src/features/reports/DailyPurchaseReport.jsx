import { useState } from 'react';
import { Chip } from '@mui/material';

import DataTable from '@/components/common/DataTable';
import { useNotify } from '@/components/common/Notifications';
import { approvalStatus } from '@/features/sales/status';
import { apiFetch } from '@/lib/api-client';
import { formatDate, formatMoney } from '@/lib/format';

import ReportLayout, { DateRangeBar, TotalRow } from './ReportLayout';

const columns = [
  { label: 'Date', render: (p) => formatDate(p.date) },
  { label: 'Purchase no.', render: (p) => p.purchase_no, search: (p) => p.purchase_no },
  { label: 'Supplier', render: (p) => p.supplier_id?.name },
  { label: 'Product', render: (p) => p.product_id?.productName ?? 'Deleted product' },
  { label: 'Status', render: (p) => <Chip size="small" {...approvalStatus(p.status)} /> },
  { label: 'Qty', align: 'right', render: (p) => p.buying_qty },
  { label: 'Total', align: 'right', render: (p) => formatMoney(p.buying_price) },
];

/** Purchases between two dates, with totals. */
export default function DailyPurchaseReport() {
  const notify = useNotify();
  const [rows, setRows] = useState(null);
  const [range, setRange] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (dates) => {
    setBusy(true);
    try {
      setRows(await apiFetch('/api/user/dailypurchasereport', { method: 'POST', body: dates }));
      setRange(dates);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ReportLayout
      title="Purchase report"
      subtitle="Purchases between two dates. Pending purchases are included and marked."
      filters={<DateRangeBar onRun={run} busy={busy} />}
      printSubtitle={range && `${formatDate(range.startDate)} – ${formatDate(range.endDate)}`}
    >
      {rows && (
        <DataTable
          columns={columns}
          rows={rows}
          paginated={false}
          searchable={false}
          emptyText="No purchases in this period."
          footer={
            <TotalRow
              span={6}
              label={`${rows.length} purchases`}
              values={[
                rows.reduce((total, p) => total + p.buying_qty, 0),
                formatMoney(rows.reduce((total, p) => total + p.buying_price, 0)),
              ]}
            />
          }
        />
      )}
    </ReportLayout>
  );
}
