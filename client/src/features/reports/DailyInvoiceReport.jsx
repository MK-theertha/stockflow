import { useState } from 'react';
import { Chip } from '@mui/material';

import DataTable from '@/components/common/DataTable';
import { useNotify } from '@/components/common/Notifications';
import { approvalStatus } from '@/features/sales/status';
import { apiFetch } from '@/lib/api-client';
import { formatDate, formatMoney } from '@/lib/format';

import ReportLayout, { DateRangeBar, TotalRow } from './ReportLayout';

const columns = [
  { label: 'Date', render: (i) => formatDate(i.date) },
  { label: 'Invoice', render: (i) => i.invoice_no, search: (i) => i.invoice_no },
  {
    label: 'Customer',
    render: (i) => i.payment?.customer_id?.name,
    search: (i) => i.payment?.customer_id?.name,
  },
  { label: 'Status', render: (i) => <Chip size="small" {...approvalStatus(i.status)} /> },
  { label: 'Total', align: 'right', render: (i) => formatMoney(i.payment?.total_amount) },
  { label: 'Paid', align: 'right', render: (i) => formatMoney(i.payment?.paid_amount) },
  { label: 'Due', align: 'right', render: (i) => formatMoney(i.payment?.due_amount) },
];

const sum = (rows, field) => rows.reduce((total, row) => total + (row.payment?.[field] ?? 0), 0);

/** Invoices between two dates, with totals. */
export default function DailyInvoiceReport() {
  const notify = useNotify();
  const [rows, setRows] = useState(null);
  const [range, setRange] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (dates) => {
    setBusy(true);
    try {
      setRows(await apiFetch('/api/user/dailyinvoicesreport', { method: 'POST', body: dates }));
      setRange(dates);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ReportLayout
      title="Sales report"
      subtitle="Invoices between two dates. Pending invoices are included and marked."
      filters={<DateRangeBar onRun={run} busy={busy} />}
      printSubtitle={range && `${formatDate(range.startDate)} – ${formatDate(range.endDate)}`}
    >
      {rows && (
        <DataTable
          columns={columns}
          rows={rows}
          paginated={false}
          searchable={false}
          emptyText="No invoices in this period."
          footer={
            <TotalRow
              span={5}
              label={`${rows.length} invoices`}
              values={[
                formatMoney(sum(rows, 'total_amount')),
                formatMoney(sum(rows, 'paid_amount')),
                formatMoney(sum(rows, 'due_amount')),
              ]}
            />
          }
        />
      )}
    </ReportLayout>
  );
}
