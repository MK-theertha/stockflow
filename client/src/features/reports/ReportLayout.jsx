import { useRef, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Print } from '@mui/icons-material';

import PageHeader from '@/components/common/PageHeader';
import { APP_NAME } from '@/lib/brand';
import { toInputDate } from '@/lib/format';
import { printElement } from '@/lib/print';

const startOfMonth = () => {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

/** From / to dates with a Run button. Defaults to this month. */
export function DateRangeBar({ onRun, busy }) {
  const [range, setRange] = useState({ startDate: startOfMonth(), endDate: toInputDate() });
  const set = (name) => (event) => setRange((prev) => ({ ...prev, [name]: event.target.value }));

  return (
    <Paper
      component="form"
      variant="outlined"
      sx={{ p: 2, mb: 2 }}
      onSubmit={(event) => {
        event.preventDefault();
        onRun(range);
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField
          label="From"
          type="date"
          required
          InputLabelProps={{ shrink: true }}
          value={range.startDate}
          onChange={set('startDate')}
        />
        <TextField
          label="To"
          type="date"
          required
          InputLabelProps={{ shrink: true }}
          value={range.endDate}
          onChange={set('endDate')}
        />
        <Button type="submit" variant="contained" disabled={busy} sx={{ flexShrink: 0 }}>
          Run report
        </Button>
      </Stack>
    </Paper>
  );
}

/** A table footer row: a label across the first columns, then values. */
export function TotalRow({ span, label, values }) {
  return (
    <TableRow>
      <TableCell colSpan={span} sx={{ fontWeight: 700 }}>
        {label}
      </TableCell>
      {values.map((value, index) => (
        <TableCell key={index} align="right" sx={{ fontWeight: 700 }}>
          {value}
        </TableCell>
      ))}
    </TableRow>
  );
}

/**
 * Page header with a Print button, filters, and the printable report body.
 * Only `children` is printed, with a title line on top.
 */
export default function ReportLayout({ title, subtitle, filters, printSubtitle, children }) {
  const printRef = useRef(null);

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button startIcon={<Print />} onClick={() => printElement(printRef.current)}>
            Print
          </Button>
        }
      />
      {filters}
      <Box ref={printRef}>
        <Box sx={{ display: 'none', '@media print': { display: 'block' } }} className="print-only">
          <Typography variant="h6">
            {APP_NAME} · {title}
          </Typography>
          {printSubtitle && <Typography variant="body2">{printSubtitle}</Typography>}
        </Box>
        {children}
      </Box>
    </>
  );
}
