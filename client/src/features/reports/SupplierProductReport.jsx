import { useState } from 'react';
import {
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

import DataTable from '@/components/common/DataTable';
import { useNotify } from '@/components/common/Notifications';
import { useApi } from '@/hooks/useApi';
import { apiFetch } from '@/lib/api-client';

import ReportLayout, { TotalRow } from './ReportLayout';

const columns = [
  { label: 'Product', render: (p) => p.productName, search: (p) => p.productName },
  { label: 'Supplier', render: (p) => p.supplierNameId?.name },
  { label: 'Category', render: (p) => p.categoryNameId?.name },
  { label: 'In stock', align: 'right', render: (p) => p.quantity },
];

/** Products and their stock, for one supplier or one category. */
export default function SupplierProductReport() {
  const notify = useNotify();
  const { data: options } = useApi('/api/user/supplierproductwisereport');
  const [reportType, setReportType] = useState('supplier');
  const [selectedId, setSelectedId] = useState('');
  const [rows, setRows] = useState(null);

  const choices = (reportType === 'supplier' ? options?.supplier : options?.category) ?? [];
  const selectedName = choices.find((choice) => choice._id === selectedId)?.name;

  const run = async (event) => {
    event.preventDefault();
    try {
      setRows(
        await apiFetch('/api/user/getReportData', {
          method: 'POST',
          body: { reportType, name: selectedId },
        })
      );
    } catch (error) {
      notify.error(error.message);
    }
  };

  return (
    <ReportLayout
      title="Supplier / category report"
      subtitle="Stock of every product from one supplier or in one category."
      printSubtitle={
        selectedName && `${reportType === 'supplier' ? 'Supplier' : 'Category'}: ${selectedName}`
      }
      filters={
        <Paper component="form" variant="outlined" sx={{ p: 2, mb: 2 }} onSubmit={run}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={reportType}
              onChange={(event, value) => {
                if (!value) return;
                setReportType(value);
                setSelectedId('');
                setRows(null);
              }}
            >
              <ToggleButton value="supplier">By supplier</ToggleButton>
              <ToggleButton value="category">By category</ToggleButton>
            </ToggleButtonGroup>
            <TextField
              select
              required
              label={reportType === 'supplier' ? 'Supplier' : 'Category'}
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {choices.map((choice) => (
                <MenuItem key={choice._id} value={choice._id}>
                  {choice.name}
                </MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained" sx={{ flexShrink: 0 }}>
              Run report
            </Button>
          </Stack>
        </Paper>
      }
    >
      {rows && (
        <DataTable
          columns={columns}
          rows={rows}
          paginated={false}
          searchable={false}
          emptyText="No products found."
          footer={
            <TotalRow
              span={4}
              label={`${rows.length} products`}
              values={[rows.reduce((total, p) => total + p.quantity, 0)]}
            />
          }
        />
      )}
    </ReportLayout>
  );
}
